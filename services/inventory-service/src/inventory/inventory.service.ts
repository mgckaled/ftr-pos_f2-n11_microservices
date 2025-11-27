import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Product } from './entities/product.entity'
import { InventoryReservation } from './entities/reservation.entity'
import { ProcessedEvent } from './entities/processed-event.entity'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('inventory-service')

@Injectable()
export class InventoryService {
	constructor(
		@InjectRepository(Product)
		private productsRepository: Repository<Product>,
		@InjectRepository(InventoryReservation)
		private reservationsRepository: Repository<InventoryReservation>,
		@InjectRepository(ProcessedEvent)
		private processedEventsRepository: Repository<ProcessedEvent>
	) {}

	async findAllProducts(page: number = 1, limit: number = 10) {
		const [products, total] = await this.productsRepository.findAndCount({
			skip: (page - 1) * limit,
			take: limit,
		})

		return {
			products,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		}
	}

	async findProductById(productId: string): Promise<Product> {
		const product = await this.productsRepository.findOne({
			where: { productId },
		})

		if (!product) {
			throw new NotFoundException(`Produto ${productId} não encontrado`)
		}

		return product
	}

	async reserve(orderId: string, items: Array<{ productId: string; quantity: number }>) {
		logger.info(`Reserving inventory for order ${orderId}`)

		const unavailableProducts: Array<{
			productId: string
			requested: number
			available: number
		}> = []

		for (const item of items) {
			const product = await this.productsRepository.findOne({
				where: { productId: item.productId },
			})

			if (!product) {
				throw new NotFoundException(`Produto ${item.productId} não encontrado`)
			}

			if (product.availableQuantity < item.quantity) {
				unavailableProducts.push({
					productId: item.productId,
					requested: item.quantity,
					available: product.availableQuantity,
				})
			}
		}

		if (unavailableProducts.length > 0) {
			throw new BadRequestException({
				message: 'Produtos indisponíveis',
				unavailableProducts,
			})
		}

		const reservations = []
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

		for (const item of items) {
			const product = await this.productsRepository.findOne({
				where: { productId: item.productId },
			})

			await this.productsRepository.update(
				{ productId: item.productId },
				{
					availableQuantity: product!.availableQuantity - item.quantity,
					reservedQuantity: product!.reservedQuantity + item.quantity,
				}
			)

			const reservation = this.reservationsRepository.create({
				orderId,
				productId: item.productId,
				quantity: item.quantity,
				status: 'RESERVED',
				expiresAt,
			})

			const savedReservation = await this.reservationsRepository.save(reservation)
			reservations.push(savedReservation)
		}

		logger.info(`Inventory reserved successfully for order ${orderId}`)

		return {
			reservationId: reservations[0].reservationId,
			orderId,
			expiresAt,
			items: reservations.map((r) => ({
				productId: r.productId,
				quantity: r.quantity,
			})),
		}
	}

	async release(orderId: string) {
		logger.info(`Releasing inventory for order ${orderId}`)

		const reservations = await this.reservationsRepository.find({
			where: { orderId, status: 'RESERVED' },
		})

		if (reservations.length === 0) {
			logger.warn(`No reservations found for order ${orderId}`)
			return { message: 'Nenhuma reserva encontrada para este pedido' }
		}

		for (const reservation of reservations) {
			const product = await this.productsRepository.findOne({
				where: { productId: reservation.productId },
			})

			if (product) {
				await this.productsRepository.update(
					{ productId: reservation.productId },
					{
						availableQuantity: product.availableQuantity + reservation.quantity,
						reservedQuantity: product.reservedQuantity - reservation.quantity,
					}
				)
			}

			await this.reservationsRepository.update(
				{ reservationId: reservation.reservationId },
				{ status: 'RELEASED' }
			)
		}

		logger.info(`Inventory released successfully for order ${orderId}`)

		return { message: 'Reservas liberadas com sucesso' }
	}

	async commit(orderId: string) {
		logger.info(`Committing inventory for order ${orderId}`)

		const reservations = await this.reservationsRepository.find({
			where: { orderId, status: 'RESERVED' },
		})

		if (reservations.length === 0) {
			logger.warn(`No reservations found for order ${orderId}`)
			return { message: 'Nenhuma reserva encontrada para este pedido' }
		}

		for (const reservation of reservations) {
			const product = await this.productsRepository.findOne({
				where: { productId: reservation.productId },
			})

			if (product) {
				await this.productsRepository.update(
					{ productId: reservation.productId },
					{
						reservedQuantity: product.reservedQuantity - reservation.quantity,
					}
				)
			}

			await this.reservationsRepository.update(
				{ reservationId: reservation.reservationId },
				{ status: 'COMMITTED' }
			)
		}

		logger.info(`Inventory committed successfully for order ${orderId}`)

		return { message: 'Reservas confirmadas com sucesso' }
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async releaseExpiredReservations() {
		const now = new Date()

		const expiredReservations = await this.reservationsRepository.find({
			where: {
				status: 'RESERVED',
				expiresAt: LessThan(now),
			},
		})

		if (expiredReservations.length === 0) {
			return
		}

		logger.info(`Found ${expiredReservations.length} expired reservations to release`)

		for (const reservation of expiredReservations) {
			const product = await this.productsRepository.findOne({
				where: { productId: reservation.productId },
			})

			if (product) {
				await this.productsRepository.update(
					{ productId: reservation.productId },
					{
						availableQuantity: product.availableQuantity + reservation.quantity,
						reservedQuantity: product.reservedQuantity - reservation.quantity,
					}
				)
			}

			await this.reservationsRepository.update(
				{ reservationId: reservation.reservationId },
				{ status: 'RELEASED' }
			)

			logger.info(
				`Released expired reservation ${reservation.reservationId} for order ${reservation.orderId}`
			)
		}
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
