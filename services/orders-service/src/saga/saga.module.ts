import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SagaOrchestratorService } from './saga-orchestrator.service';
import { SagaInstance } from './entities/saga-instance.entity';
import { SagaStepExecution } from './entities/saga-step-execution.entity';
import { Order } from '../orders/entities/order.entity';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SagaInstance, SagaStepExecution, Order]),
    KafkaModule,
  ],
  providers: [SagaOrchestratorService],
  exports: [SagaOrchestratorService],
})
export class SagaModule {}
