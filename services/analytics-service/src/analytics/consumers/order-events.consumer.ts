import { Injectable, OnModuleInit } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { KafkaService } from '../../kafka/kafka.service'
import { OrderCreatedEvent } from '../events/order-created.event'
import { OrderConfirmedEvent } from '../events/order-confirmed.event'
import { OrderCancelledEvent } from '../events/order-cancelled.event'
import { ProcessedEvent } from '../entities/processed-event.entity'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('order-events-consumer')

@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
	constructor(
		private kafkaService: KafkaService,
		private eventBus: EventBus,
		@InjectRepository(ProcessedEvent)
		private processedEventsRepository: Repository<ProcessedEvent>
	) {}

	async onModuleInit() {
		await this.kafkaService.subscribe(
			'orders.created',
			'analytics-orders-created-consumer',
			this.handleOrderCreated.bind(this)
		)

		await this.kafkaService.subscribe(
			'orders.confirmed',
			'analytics-orders-confirmed-consumer',
			this.handleOrderConfirmed.bind(this)
		)

		await this.kafkaService.subscribe(
			'orders.cancelled',
			'analytics-orders-cancelled-consumer',
			this.handleOrderCancelled.bind(this)
		)

		logger.info('Order events consumer initialized')
	}

	private async handleOrderCreated(message: any) {
		const { eventId, payload } = message

		const alreadyProcessed = await this.isEventProcessed(eventId)
		if (alreadyProcessed) {
			logger.warn(`Event ${eventId} already processed, skipping`)
			return
		}

		const event = new OrderCreatedEvent(
			payload.orderId,
			payload.userId,
			payload.items,
			payload.totalAmount,
			new Date(payload.createdAt)
		)

		this.eventBus.publish(event)

		await this.markEventAsProcessed(eventId, 'order-created-consumer')
		logger.info(`Order created event processed: ${eventId}`)
	}

	private async handleOrderConfirmed(message: any) {
		const { eventId, payload } = message

		const alreadyProcessed = await this.isEventProcessed(eventId)
		if (alreadyProcessed) {
			logger.warn(`Event ${eventId} already processed, skipping`)
			return
		}

		const event = new OrderConfirmedEvent(payload.orderId, new Date())

		this.eventBus.publish(event)

		await this.markEventAsProcessed(eventId, 'order-confirmed-consumer')
		logger.info(`Order confirmed event processed: ${eventId}`)
	}

	private async handleOrderCancelled(message: any) {
		const { eventId, payload } = message

		const alreadyProcessed = await this.isEventProcessed(eventId)
		if (alreadyProcessed) {
			logger.warn(`Event ${eventId} already processed, skipping`)
			return
		}

		const event = new OrderCancelledEvent(payload.orderId, new Date())

		this.eventBus.publish(event)

		await this.markEventAsProcessed(eventId, 'order-cancelled-consumer')
		logger.info(`Order cancelled event processed: ${eventId}`)
	}

	private async isEventProcessed(eventId: string): Promise<boolean> {
		const exists = await this.processedEventsRepository.findOne({
			where: { eventId },
		})
		return !!exists
	}

	private async markEventAsProcessed(eventId: string, consumerName: string): Promise<void> {
		const processedEvent = this.processedEventsRepository.create({
			eventId,
			eventType: consumerName,
			consumerName,
		})
		await this.processedEventsRepository.save(processedEvent)
	}
}
