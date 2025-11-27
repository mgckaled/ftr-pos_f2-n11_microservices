export class OrderConfirmedEvent {
  constructor(
    public readonly orderId: string,
    public readonly confirmedAt: Date,
  ) {}
}
