export class GetDailySummaryQuery {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
