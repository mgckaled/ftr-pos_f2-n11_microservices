import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { createLogger } from '@packages/common-utils';

const logger = createLogger('kafka-service');

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];

    this.kafka = new Kafka({
      clientId: 'analytics-service',
      brokers,
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });
  }

  async onModuleInit() {
    logger.info('Kafka service initialized');
  }

  async onModuleDestroy() {
    for (const [groupId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      logger.info(`Kafka consumer ${groupId} disconnected`);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    callback: (message: any) => Promise<void>
  ) {
    const consumer = this.kafka.consumer({ groupId });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (value) {
            const parsedMessage = JSON.parse(value);
            await callback(parsedMessage);
          }
        } catch (error: any) {
          logger.error(`Error processing message from ${topic}:`, error);
        }
      },
    });

    this.consumers.set(groupId, consumer);
    logger.info(`Kafka consumer ${groupId} subscribed to ${topic}`);
  }
}
