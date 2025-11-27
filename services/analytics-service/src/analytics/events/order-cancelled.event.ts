export class OrderCancelledEvent {
  constructor(
    public readonly orderId: string,
    public readonly cancelledAt: Date,
  ) {}
}
