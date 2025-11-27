import { Injectable, OnModuleInit } from '@nestjs/common'
import { KafkaService } from '../../kafka/kafka.service'
import { InventoryService } from '../inventory.service'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('order-events-consumer')

@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
	constructor(
		private kafkaService: KafkaService,
		private inventoryService: InventoryService
	) {}

	async onModuleInit() {
		await this.kafkaService.subscribe(
			'orders.confirmed',
			'inventory-service-group',
			this.handleOrderConfirmed.bind(this)
		)

		await this.kafkaService.subscribe(
			'orders.cancelled',
			'inventory-service-group',
			this.handleOrderCancelled.bind(this)
		)

		logger.info('OrderEventsConsumer initialized and subscribed to topics')
	}

	private async handleOrderConfirmed(message: any) {
		const { eventId, payload } = message

		logger.info(`Processing OrderConfirmed event: ${eventId}`)

		const alreadyProcessed = await this.inventoryService.isEventProcessed(eventId)

		if (alreadyProcessed) {
			logger.warn(`Event ${eventId} already processed, skipping`)
			return
		}

		try {
			await this.inventoryService.commit(payload.orderId)
			await this.inventoryService.markEventAsProcessed(eventId, 'order-confirmed-consumer')

			logger.info(`OrderConfirmed event ${eventId} processed successfully`)
		} catch (error: any) {
			logger.error(`Failed to process OrderConfirmed event ${eventId}:`, error.message)
		}
	}

	private async handleOrderCancelled(message: any) {
		const { eventId, payload } = message

		logger.info(`Processing OrderCancelled event: ${eventId}`)

		const alreadyProcessed = await this.inventoryService.isEventProcessed(eventId)

		if (alreadyProcessed) {
			logger.warn(`Event ${eventId} already processed, skipping`)
			return
		}

		try {
			await this.inventoryService.release(payload.orderId)
			await this.inventoryService.markEventAsProcessed(eventId, 'order-cancelled-consumer')

			logger.info(`OrderCancelled event ${eventId} processed successfully`)
		} catch (error: any) {
			logger.error(`Failed to process OrderCancelled event ${eventId}:`, error.message)
		}
	}
}
