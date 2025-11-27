import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from './entities/order.entity'
import { ProcessedEvent } from './entities/processed-event.entity'
import { CreateOrderDto } from './dto/create-order.dto'
import { SagaOrchestratorService } from '../saga/saga-orchestrator.service'
import { createLogger } from '@packages/common-utils'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'

const logger = createLogger('orders-service')

@Injectable()
export class OrdersService {
	constructor(
		@InjectRepository(Order)
		private ordersRepository: Repository<Order>,
		@InjectRepository(ProcessedEvent)
		private processedEventsRepository: Repository<ProcessedEvent>,
		private sagaOrchestrator: SagaOrchestratorService,
		private configService: ConfigService
	) {}

	async create(userId: string, createOrderDto: CreateOrderDto) {
		logger.info(`Creating order for user: ${userId}`)

		const inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL')

		const productsWithPrices = await Promise.all(
			createOrderDto.items.map(async (item) => {
				try {
					const response = await axios.get(
						`${inventoryServiceUrl}/inventory/products/${item.productId}`,
						{ timeout: 5000 }
					)

					return {
						productId: item.productId,
						quantity: item.quantity,
						price: response.data.price,
					}
				} catch (error) {
					logger.error(`Failed to fetch product ${item.productId}:`, error.message)
					throw new NotFoundException(`Produto ${item.productId} não encontrado`)
				}
			})
		)

		const totalAmount = productsWithPrices.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		)

		const order = this.ordersRepository.create({
			userId,
			status: 'PENDING',
			totalAmount,
			items: productsWithPrices,
		})

		const savedOrder = await this.ordersRepository.save(order)

		logger.info(`Order created with ID: ${savedOrder.orderId}`)

		setImmediate(() => {
			this.sagaOrchestrator.executeCreateOrderSaga(savedOrder).catch((error) => {
				logger.error(`Saga execution failed for order ${savedOrder.orderId}:`, error)
			})
		})

		return {
			orderId: savedOrder.orderId,
			status: savedOrder.status,
			totalAmount: savedOrder.totalAmount,
			items: savedOrder.items,
			createdAt: savedOrder.createdAt,
		}
	}

	async findOne(orderId: string): Promise<Order> {
		const order = await this.ordersRepository.findOne({ where: { orderId } })

		if (!order) {
			throw new NotFoundException(`Pedido ${orderId} não encontrado`)
		}

		return order
	}

	async findByUser(userId: string): Promise<Order[]> {
		return this.ordersRepository.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		})
	}

	async updateStatus(
		orderId: string,
		status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
	): Promise<void> {
		await this.ordersRepository.update({ orderId }, { status })
		logger.info(`Order ${orderId} status updated to ${status}`)
	}

	async isEventProcessed(eventId: string): Promise<boolean> {
		const event = await this.processedEventsRepository.findOne({
			where: { eventId },
		})
		return !!event
	}

	async markEventAsProcessed(eventId: string, consumerName: string): Promise<void> {
		const processedEvent = this.processedEventsRepository.create({
			eventId,
			consumerName,
		})
		await this.processedEventsRepository.save(processedEvent)
	}
}
