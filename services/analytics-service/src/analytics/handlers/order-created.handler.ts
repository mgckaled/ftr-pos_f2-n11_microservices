import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrdersAnalyticsView } from '../entities/orders-analytics-view.entity';
import { DailySalesSummary } from '../entities/daily-sales-summary.entity';
import { createLogger } from '@packages/common-utils';

const logger = createLogger('order-created-handler');

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(
    @InjectRepository(OrdersAnalyticsView)
    private ordersViewRepository: Repository<OrdersAnalyticsView>,
    @InjectRepository(DailySalesSummary)
    private dailySummaryRepository: Repository<DailySalesSummary>,
  ) {}

  async handle(event: OrderCreatedEvent) {
    try {
      const orderView = this.ordersViewRepository.create({
        orderId: event.orderId,
        userId: event.userId,
        totalAmount: event.totalAmount,
        status: 'PENDING',
        itemsCount: event.items.length,
        items: event.items,
        createdAt: event.createdAt,
      });

      await this.ordersViewRepository.save(orderView);

      await this.updateDailySummary(event.createdAt, {
        totalOrders: 1,
      });

      logger.info(`Order analytics view created for order ${event.orderId}`);
    } catch (error: any) {
      logger.error(`Error handling OrderCreatedEvent: ${error.message}`, error);
      throw error;
    }
  }

  private async updateDailySummary(date: Date, updates: Partial<DailySalesSummary>) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    let summary = await this.dailySummaryRepository.findOne({
      where: { date: dayStart },
    });

    if (!summary) {
      summary = this.dailySummaryRepository.create({
        date: dayStart,
        totalOrders: 0,
        confirmedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        confirmedRevenue: 0,
      });
    }

    Object.assign(summary, {
      totalOrders: summary.totalOrders + (updates.totalOrders || 0),
      confirmedOrders: summary.confirmedOrders + (updates.confirmedOrders || 0),
      cancelledOrders: summary.cancelledOrders + (updates.cancelledOrders || 0),
      totalRevenue: Number(summary.totalRevenue) + (Number(updates.totalRevenue) || 0),
      confirmedRevenue: Number(summary.confirmedRevenue) + (Number(updates.confirmedRevenue) || 0),
    });

    await this.dailySummaryRepository.save(summary);
  }
}
