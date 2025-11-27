import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('daily_sales_summary')
export class DailySalesSummary {
	@PrimaryGeneratedColumn('uuid', { name: 'summary_id' })
	summaryId: string

	@Column({ type: 'date', unique: true })
	date: Date

	@Column({ name: 'total_orders', type: 'int', default: 0 })
	totalOrders: number

	@Column({ name: 'confirmed_orders', type: 'int', default: 0 })
	confirmedOrders: number

	@Column({ name: 'cancelled_orders', type: 'int', default: 0 })
	cancelledOrders: number

	@Column({ name: 'total_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
	totalRevenue: number

	@Column({ name: 'confirmed_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
	confirmedRevenue: number

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
