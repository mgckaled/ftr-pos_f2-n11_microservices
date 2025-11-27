import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { createLogger } from '@packages/common-utils'

const logger = createLogger('inventory-service')

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

	const port = process.env.PORT || 3002
	await app.listen(port)

	logger.info(`Inventory Service running on http://localhost:${port}`)
}

bootstrap()
