import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { GetOrdersAnalyticsQuery } from '../queries/get-orders-analytics.query';
import { OrdersAnalyticsView } from '../entities/orders-analytics-view.entity';

@QueryHandler(GetOrdersAnalyticsQuery)
export class GetOrdersAnalyticsHandler implements IQueryHandler<GetOrdersAnalyticsQuery> {
  constructor(
    @InjectRepository(OrdersAnalyticsView)
    private ordersViewRepository: Repository<OrdersAnalyticsView>,
  ) {}

  async execute(query: GetOrdersAnalyticsQuery): Promise<OrdersAnalyticsView[]> {
    const { userId, status, startDate, endDate } = query;

    const where: FindOptionsWhere<OrdersAnalyticsView> = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const orders = await this.ordersViewRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    return orders;
  }
}
