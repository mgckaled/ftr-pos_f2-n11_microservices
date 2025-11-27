import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InventoryService } from './inventory.service'
import { InventoryController } from './inventory.controller'
import { Product } from './entities/product.entity'
import { InventoryReservation } from './entities/reservation.entity'
import { ProcessedEvent } from './entities/processed-event.entity'
import { KafkaModule } from '../kafka/kafka.module'
import { AuthModule } from '../auth/auth.module'
import { OrderEventsConsumer } from './consumers/order-events.consumer'

@Module({
	imports: [
		TypeOrmModule.forFeature([Product, InventoryReservation, ProcessedEvent]),
		KafkaModule,
		AuthModule,
	],
	controllers: [InventoryController],
	providers: [InventoryService, OrderEventsConsumer],
	exports: [InventoryService],
})
export class InventoryModule {}
