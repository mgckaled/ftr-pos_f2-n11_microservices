import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createLogger } from '@packages/common-utils';

const logger = createLogger('analytics-service');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3004);

  await app.listen(port);
  logger.info(`Analytics Service running on port ${port}`);
}

bootstrap();
