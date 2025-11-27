import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SagaInstance } from './entities/saga-instance.entity';
import { SagaStepExecution } from './entities/saga-step-execution.entity';
import { Order } from '../orders/entities/order.entity';
import { KafkaService } from '../kafka/kafka.service';
import { ConfigService } from '@nestjs/config';
import { createLogger, generateCorrelationId } from '@packages/common-utils';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('saga-orchestrator');

interface SagaStep {
  name: string;
  action: (context: any) => Promise<any>;
  compensation: (context: any) => Promise<void>;
}

@Injectable()
export class SagaOrchestratorService {
  constructor(
    @InjectRepository(SagaInstance)
    private sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStepExecution)
    private sagaStepRepository: Repository<SagaStepExecution>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private kafkaService: KafkaService,
    private configService: ConfigService,
  ) {}

  async executeCreateOrderSaga(order: Order): Promise<void> {
    const correlationId = generateCorrelationId();

    logger.info(`Starting CreateOrderSaga for order ${order.orderId}`, { correlationId });

    const sagaInstance = this.sagaInstanceRepository.create({
      orderId: order.orderId,
      sagaType: 'CreateOrder',
      status: 'STARTED',
      currentStep: 0,
      payload: {
        orderId: order.orderId,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        correlationId,
      },
    });

    await this.sagaInstanceRepository.save(sagaInstance);

    const steps: SagaStep[] = [
      {
        name: 'reserve-inventory',
        action: async (context) => {
          logger.info(`Executing step: reserve-inventory for order ${context.orderId}`);

          const inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL');

          const response = await axios.post(
            `${inventoryServiceUrl}/inventory/reserve`,
            {
              orderId: context.orderId,
              items: context.items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
            {
              timeout: 10000,
              headers: {
                'x-correlation-id': context.correlationId,
              },
            }
          );

          return { reservationId: response.data.reservationId };
        },
        compensation: async (context) => {
          logger.info(`Compensating step: reserve-inventory for order ${context.orderId}`);

          const inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL');

          await axios.post(
            `${inventoryServiceUrl}/inventory/release`,
            { orderId: context.orderId },
            {
              timeout: 10000,
              headers: {
                'x-correlation-id': context.correlationId,
              },
            }
          );
        },
      },
      {
        name: 'confirm-order',
        action: async (context) => {
          logger.info(`Executing step: confirm-order for order ${context.orderId}`);

          await this.ordersRepository.update(
            { orderId: context.orderId },
            { status: 'CONFIRMED' }
          );

          await this.kafkaService.send('orders.confirmed', [
            {
              eventId: uuidv4(),
              eventType: 'OrderConfirmed',
              aggregateId: context.orderId,
              timestamp: new Date(),
              correlationId: context.correlationId,
              payload: {
                orderId: context.orderId,
                totalAmount: context.totalAmount,
              },
            },
          ]);

          return { confirmed: true };
        },
        compensation: async (context) => {
          logger.info(`Compensating step: confirm-order for order ${context.orderId}`);

          await this.ordersRepository.update(
            { orderId: context.orderId },
            { status: 'CANCELLED' }
          );

          await this.kafkaService.send('orders.cancelled', [
            {
              eventId: uuidv4(),
              eventType: 'OrderCancelled',
              aggregateId: context.orderId,
              timestamp: new Date(),
              correlationId: context.correlationId,
              payload: {
                orderId: context.orderId,
                reason: 'Saga compensation',
              },
            },
          ]);
        },
      },
    ];

    try {
      const context = { ...sagaInstance.payload };

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        await this.recordStepExecution(sagaInstance.sagaId, step.name, 'PENDING');

        try {
          const result = await step.action(context);
          Object.assign(context, result);

          await this.recordStepExecution(sagaInstance.sagaId, step.name, 'SUCCESS');
          await this.sagaInstanceRepository.update(
            { sagaId: sagaInstance.sagaId },
            { currentStep: i + 1 }
          );

          logger.info(`Step ${step.name} completed successfully`);
        } catch (error: any) {
          logger.error(`Step ${step.name} failed:`, error.message);

          await this.recordStepExecution(
            sagaInstance.sagaId,
            step.name,
            'FAILED',
            error.message
          );

          throw error;
        }
      }

      await this.sagaInstanceRepository.update(
        { sagaId: sagaInstance.sagaId },
        { status: 'COMPLETED' }
      );

      logger.info(`Saga completed successfully for order ${order.orderId}`);
    } catch (error) {
      logger.error(`Saga failed for order ${order.orderId}, starting compensation`, error);

      await this.sagaInstanceRepository.update(
        { sagaId: sagaInstance.sagaId },
        { status: 'COMPENSATING' }
      );

      await this.compensate(sagaInstance.sagaId, steps, { ...sagaInstance.payload });

      await this.sagaInstanceRepository.update(
        { sagaId: sagaInstance.sagaId },
        { status: 'COMPENSATED' }
      );

      logger.info(`Saga compensated for order ${order.orderId}`);
    }
  }

  private async compensate(
    sagaId: string,
    steps: SagaStep[],
    context: any
  ): Promise<void> {
    const executedSteps = await this.sagaStepRepository.find({
      where: { sagaId, status: 'SUCCESS' },
      order: { executedAt: 'DESC' },
    });

    for (const execution of executedSteps) {
      const step = steps.find((s) => s.name === execution.stepName);

      if (step) {
        try {
          await step.compensation(context);
          await this.sagaStepRepository.update(
            { id: execution.id },
            { status: 'COMPENSATED' }
          );
          logger.info(`Step ${step.name} compensated successfully`);
        } catch (error: any) {
          logger.error(`Failed to compensate step ${step.name}:`, error.message);
        }
      }
    }
  }

  private async recordStepExecution(
    sagaId: string,
    stepName: string,
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPENSATED',
    errorMessage?: string
  ): Promise<void> {
    const existing = await this.sagaStepRepository.findOne({
      where: { sagaId, stepName },
    });

    if (existing) {
      await this.sagaStepRepository.update(
        { id: existing.id },
        { status, errorMessage }
      );
    } else {
      const execution = this.sagaStepRepository.create({
        sagaId,
        stepName,
        status,
        errorMessage,
      });
      await this.sagaStepRepository.save(execution);
    }
  }
}
