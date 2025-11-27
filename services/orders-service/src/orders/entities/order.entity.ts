import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

@Entity('orders')
export class Order {
	@PrimaryGeneratedColumn('uuid', { name: 'order_id' })
	orderId: string

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string

	@Column({ type: 'varchar', length: 50 })
	status: OrderStatus

	@Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
	totalAmount: number

	@Column({ type: 'jsonb' })
	items: Array<{
		productId: string
		quantity: number
		price: number
	}>

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
