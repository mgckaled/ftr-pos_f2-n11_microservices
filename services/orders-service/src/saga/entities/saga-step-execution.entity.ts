import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm'
import { SagaInstance } from './saga-instance.entity'

export type StepStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPENSATED'

@Entity('saga_step_executions')
export class SagaStepExecution {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column({ name: 'saga_id', type: 'uuid' })
	sagaId: string

	@Column({ name: 'step_name', type: 'varchar', length: 100 })
	stepName: string

	@Column({ type: 'varchar', length: 50 })
	status: StepStatus

	@CreateDateColumn({ name: 'executed_at' })
	executedAt: Date

	@Column({ name: 'error_message', type: 'text', nullable: true })
	errorMessage?: string

	@ManyToOne(() => SagaInstance)
	@JoinColumn({ name: 'saga_id' })
	saga: SagaInstance
}
