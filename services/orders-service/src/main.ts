import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('orders-service')

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

	const port = process.env.PORT || 3001
	await app.listen(port)

	logger.info(`Orders Service running on http://localhost:${port}`)
}

bootstrap()
