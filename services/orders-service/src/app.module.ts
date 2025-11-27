import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrdersModule } from './orders/orders.module'
import { KafkaModule } from './kafka/kafka.module'
import { SagaModule } from './saga/saga.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				url: configService.get('DATABASE_URL'),
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				synchronize: true,
				logging: false,
			}),
			inject: [ConfigService],
		}),
		OrdersModule,
		KafkaModule,
		SagaModule,
	],
})
export class AppModule {}
