export interface BaseEvent {
	eventId: string
	eventType: string
	aggregateId: string
	timestamp: Date
	correlationId?: string
}

export interface OrderCreatedEvent extends BaseEvent {
	eventType: 'OrderCreated'
	payload: {
		orderId: string
		userId: string
		items: Array<{
			productId: string
			quantity: number
			price: number
		}>
		totalAmount: number
	}
}

export interface OrderConfirmedEvent extends BaseEvent {
	eventType: 'OrderConfirmed'
	payload: {
		orderId: string
		totalAmount: number
	}
}

export interface OrderCancelledEvent extends BaseEvent {
	eventType: 'OrderCancelled'
	payload: {
		orderId: string
		reason: string
	}
}

export interface InventoryReservedEvent extends BaseEvent {
	eventType: 'InventoryReserved'
	payload: {
		orderId: string
		reservationId: string
		items: Array<{
			productId: string
			quantity: number
		}>
	}
}

export interface InventoryReservationFailedEvent extends BaseEvent {
	eventType: 'InventoryReservationFailed'
	payload: {
		orderId: string
		reason: string
		unavailableProducts: Array<{
			productId: string
			requested: number
			available: number
		}>
	}
}

export type DomainEvent =
	| OrderCreatedEvent
	| OrderConfirmedEvent
	| OrderCancelledEvent
	| InventoryReservedEvent
	| InventoryReservationFailedEvent
