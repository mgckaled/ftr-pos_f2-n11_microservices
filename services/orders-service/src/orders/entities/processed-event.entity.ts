import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm'

@Entity('processed_events')
export class ProcessedEvent {
	@PrimaryColumn({ name: 'event_id', type: 'varchar', length: 255 })
	eventId: string

	@CreateDateColumn({ name: 'processed_at' })
	processedAt: Date

	@Column({ name: 'consumer_name', type: 'varchar', length: 100 })
	consumerName: string
}
