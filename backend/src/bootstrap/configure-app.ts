import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ApiExceptionFilter } from '../common/http/api-exception.filter';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  const trustProxyHops = config.getOrThrow<number>('TRUST_PROXY_HOPS');
  const httpAdapter = app.getHttpAdapter().getInstance() as {
    set(name: string, value: number): void;
  };
  httpAdapter.set('trust proxy', trustProxyHops);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
