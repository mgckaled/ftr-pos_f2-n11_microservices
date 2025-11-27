import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('processed_events')
export class ProcessedEvent {
	@PrimaryColumn({ name: 'event_id', type: 'uuid' })
	eventId: string

	@Column({ name: 'event_type', type: 'varchar', length: 100 })
	eventType: string

	@Column({ name: 'consumer_name', type: 'varchar', length: 100 })
	consumerName: string

	@CreateDateColumn({ name: 'processed_at' })
	processedAt: Date
}
