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
			useFactory: (configService: ConfigService) => {
				const isDocker = configService.get('NODE_ENV') === 'docker'
				const dbHost = isDocker ? 'orders-db' : 'localhost'
				const dbPort = isDocker ? 5432 : configService.get('DB_PORT', 5433)

				const dbUrl = configService.get('DATABASE_URL') ||
					`postgresql://postgres:postgres@${dbHost}:${dbPort}/orders`

				return {
					type: 'postgres',
					url: dbUrl,
					entities: [__dirname + '/**/*.entity{.ts,.js}'],
					synchronize: true,
					logging: false,
				}
			},
			inject: [ConfigService],
		}),
		OrdersModule,
		KafkaModule,
		SagaModule,
	],
})
export class AppModule {}
