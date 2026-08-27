import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/bootstrap/configure-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/health/liveness (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/liveness')
      .set('X-Request-Id', 'e2e-health-check')
      .expect('X-Content-Type-Options', 'nosniff')
      .expect('X-Request-Id', 'e2e-health-check')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/health/readiness (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/readiness')
      .expect(200)
      .expect({ status: 'ready', database: 'up' });
  });

  afterEach(async () => {
    await app.close();
  });
});
