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
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				url: configService.get('DATABASE_URL'),
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				synchronize: true,
				logging: false,
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		UsersModule,
		JwksModule,
	],
})
export class AppModule {}
