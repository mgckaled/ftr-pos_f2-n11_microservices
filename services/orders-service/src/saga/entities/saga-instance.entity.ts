import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type SagaStatus = 'STARTED' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED'

@Entity('saga_instances')
export class SagaInstance {
	@PrimaryGeneratedColumn('uuid', { name: 'saga_id' })
	sagaId: string

	@Column({ name: 'order_id', type: 'uuid' })
	orderId: string

	@Column({ name: 'saga_type', type: 'varchar', length: 50 })
	sagaType: string

	@Column({ type: 'varchar', length: 50 })
	status: SagaStatus

	@Column({ name: 'current_step', type: 'int', default: 0 })
	currentStep: number

	@Column({ type: 'jsonb' })
	payload: any

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
