import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('products')
export class Product {
	@PrimaryGeneratedColumn('uuid', { name: 'product_id' })
	productId: string

	@Column({ type: 'varchar', length: 255 })
	name: string

	@Column({ type: 'text', nullable: true })
	description: string

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	price: number

	@Column({ name: 'available_quantity', type: 'int' })
	availableQuantity: number

	@Column({ name: 'reserved_quantity', type: 'int', default: 0 })
	reservedQuantity: number

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
