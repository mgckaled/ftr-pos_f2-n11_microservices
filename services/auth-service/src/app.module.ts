import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { JwksModule } from './jwks/jwks.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const isDocker = configService.get('NODE_ENV') === 'docker'
				const dbHost = isDocker ? 'auth-db' : 'localhost'
				const dbPort = isDocker ? 5432 : configService.get('DB_PORT', 5432)

				const dbUrl = configService.get('DATABASE_URL') ||
					`postgresql://postgres:postgres@${dbHost}:${dbPort}/auth`

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
		AuthModule,
		UsersModule,
		JwksModule,
	],
})
export class AppModule {}
