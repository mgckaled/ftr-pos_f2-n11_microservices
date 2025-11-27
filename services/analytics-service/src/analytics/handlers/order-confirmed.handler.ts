import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrderConfirmedEvent } from '../events/order-confirmed.event'
import { OrdersAnalyticsView } from '../entities/orders-analytics-view.entity'
import { DailySalesSummary } from '../entities/daily-sales-summary.entity'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('order-confirmed-handler')

@EventsHandler(OrderConfirmedEvent)
export class OrderConfirmedHandler implements IEventHandler<OrderConfirmedEvent> {
	constructor(
		@InjectRepository(OrdersAnalyticsView)
		private ordersViewRepository: Repository<OrdersAnalyticsView>,
		@InjectRepository(DailySalesSummary)
		private dailySummaryRepository: Repository<DailySalesSummary>
	) {}

	async handle(event: OrderConfirmedEvent) {
		try {
			const orderView = await this.ordersViewRepository.findOne({
				where: { orderId: event.orderId },
			})

			if (!orderView) {
				logger.warn(`Order view not found for orderId: ${event.orderId}`)
				return
			}

			orderView.status = 'CONFIRMED'
			orderView.confirmedAt = event.confirmedAt
			await this.ordersViewRepository.save(orderView)

			await this.updateDailySummary(orderView.createdAt, {
				confirmedOrders: 1,
				confirmedRevenue: Number(orderView.totalAmount),
			})

			logger.info(`Order analytics view updated to CONFIRMED for order ${event.orderId}`)
		} catch (error: any) {
			logger.error(`Error handling OrderConfirmedEvent: ${error.message}`, error)
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
				confirmedOrders: summary.confirmedOrders + (updates.confirmedOrders || 0),
				confirmedRevenue:
					Number(summary.confirmedRevenue) + (Number(updates.confirmedRevenue) || 0),
			})

			await this.dailySummaryRepository.save(summary)
		}
	}
}
