import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { createLogger } from '@packages/common-utils';

const logger = createLogger('kafka-service');

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];

    this.kafka = new Kafka({
      clientId: 'inventory-service',
      brokers,
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    logger.info('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();

    for (const [groupId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      logger.info(`Kafka consumer ${groupId} disconnected`);
    }
  }

  async send(topic: string, messages: any[]) {
    await this.producer.send({
      topic,
      messages: messages.map((msg) => ({
        value: JSON.stringify(msg),
        headers: msg.headers || {},
      })),
    });

    logger.info(`Message sent to topic ${topic}`);
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
