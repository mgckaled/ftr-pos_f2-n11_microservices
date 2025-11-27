import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders_analytics_view')
export class OrdersAnalyticsView {
  @PrimaryGeneratedColumn('uuid', { name: 'view_id' })
  viewId: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ name: 'items_count', type: 'int' })
  itemsCount: number;

  @Column({ type: 'jsonb' })
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
}
