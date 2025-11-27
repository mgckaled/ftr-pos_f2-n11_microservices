import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrderCancelledEvent } from '../events/order-cancelled.event'
import { OrdersAnalyticsView } from '../entities/orders-analytics-view.entity'
import { DailySalesSummary } from '../entities/daily-sales-summary.entity'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('order-cancelled-handler')

@EventsHandler(OrderCancelledEvent)
export class OrderCancelledHandler implements IEventHandler<OrderCancelledEvent> {
	constructor(
		@InjectRepository(OrdersAnalyticsView)
		private ordersViewRepository: Repository<OrdersAnalyticsView>,
		@InjectRepository(DailySalesSummary)
		private dailySummaryRepository: Repository<DailySalesSummary>
	) {}

	async handle(event: OrderCancelledEvent) {
		try {
			const orderView = await this.ordersViewRepository.findOne({
				where: { orderId: event.orderId },
			})

			if (!orderView) {
				logger.warn(`Order view not found for orderId: ${event.orderId}`)
				return
			}

			orderView.status = 'CANCELLED'
			orderView.cancelledAt = event.cancelledAt
			await this.ordersViewRepository.save(orderView)

			await this.updateDailySummary(orderView.createdAt, {
				cancelledOrders: 1,
			})

			logger.info(`Order analytics view updated to CANCELLED for order ${event.orderId}`)
		} catch (error: any) {
			logger.error(`Error handling OrderCancelledEvent: ${error.message}`, error)
			throw error
		}
	}

	private async updateDailySummary(date: Date, updates: Partial<DailySalesSummary>) {
		const dayStart = new Date(date)
		dayStart.setHours(0, 0, 0, 0)

		const summary = await this.dailySummaryRepository.findOne({
			where: { date: dayStart },
		})

		if (summary) {
			Object.assign(summary, {
				cancelledOrders: summary.cancelledOrders + (updates.cancelledOrders || 0),
			})

			await this.dailySummaryRepository.save(summary)
		}
	}
}
