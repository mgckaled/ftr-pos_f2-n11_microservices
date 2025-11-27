import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsModule } from './analytics/analytics.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const isDocker = configService.get('NODE_ENV') === 'docker'
				const dbHost = isDocker ? 'analytics-db' : 'localhost'
				const dbPort = isDocker ? 5432 : configService.get('DB_PORT', 5435)

				const dbUrl = configService.get('DATABASE_URL') ||
					`postgresql://postgres:postgres@${dbHost}:${dbPort}/analytics`

				const isDevelopment = configService.get<string>('NODE_ENV') === 'development'

				return {
					type: 'postgres',
					url: dbUrl,
					entities: [__dirname + '/**/*.entity{.ts,.js}'],
					synchronize: isDevelopment,
					logging: isDevelopment,
				}
			},
		}),
		AnalyticsModule,
	],
})
export class AppModule {}
