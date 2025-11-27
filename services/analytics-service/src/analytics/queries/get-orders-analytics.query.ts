export class GetOrdersAnalyticsQuery {
  constructor(
    public readonly userId?: string,
    public readonly status?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}
