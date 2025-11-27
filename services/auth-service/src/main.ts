import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('auth-service')

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	)

	app.enableCors()

	const port = process.env.PORT || 3000
	await app.listen(port)

	logger.info(`Auth Service running on http://localhost:${port}`)
	logger.info(`JWKS endpoint: http://localhost:${port}/.well-known/jwks.json`)
}

bootstrap()
