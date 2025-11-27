import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { OrdersAnalyticsView } from './entities/orders-analytics-view.entity';
import { DailySalesSummary } from './entities/daily-sales-summary.entity';
import { ProcessedEvent } from './entities/processed-event.entity';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { OrderConfirmedHandler } from './handlers/order-confirmed.handler';
import { OrderCancelledHandler } from './handlers/order-cancelled.handler';
import { GetDailySummaryHandler } from './handlers/get-daily-summary.handler';
import { GetOrdersAnalyticsHandler } from './handlers/get-orders-analytics.handler';
import { OrderEventsConsumer } from './consumers/order-events.consumer';
import { KafkaModule } from '../kafka/kafka.module';

const EventHandlers = [
  OrderCreatedHandler,
  OrderConfirmedHandler,
  OrderCancelledHandler,
];

const QueryHandlers = [
  GetDailySummaryHandler,
  GetOrdersAnalyticsHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      OrdersAnalyticsView,
      DailySalesSummary,
      ProcessedEvent,
    ]),
    KafkaModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    ...EventHandlers,
    ...QueryHandlers,
    OrderEventsConsumer,
  ],
})
export class AnalyticsModule {}
