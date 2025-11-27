import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDailySummaryQuery } from './queries/get-daily-summary.query';
import { GetOrdersAnalyticsQuery } from './queries/get-orders-analytics.query';

@Controller('analytics')
export class AnalyticsController {
  constructor(private queryBus: QueryBus) {}

  @Get('daily-summary')
  async getDailySummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const query = new GetDailySummaryQuery(
      new Date(startDate),
      new Date(endDate),
    );
    return this.queryBus.execute(query);
  }

  @Get('orders')
  async getOrdersAnalytics(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query = new GetOrdersAnalyticsQuery(
      userId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return this.queryBus.execute(query);
  }
}
