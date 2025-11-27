import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { InventoryModule } from './inventory/inventory.module'
import { KafkaModule } from './kafka/kafka.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const isDocker = configService.get('NODE_ENV') === 'docker'
				const dbHost = isDocker ? 'inventory-db' : 'localhost'
				const dbPort = isDocker ? 5432 : configService.get('DB_PORT', 5434)

				const dbUrl = configService.get('DATABASE_URL') ||
					`postgresql://postgres:postgres@${dbHost}:${dbPort}/inventory`

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
		ScheduleModule.forRoot(),
		InventoryModule,
		KafkaModule,
	],
})
export class AppModule {}
