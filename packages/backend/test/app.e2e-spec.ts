import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Ardaca Backend e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health/ready (GET)', () => {
    return request(app.getHttpServer()).get('/api/health/ready').expect(200).expect({ status: 'ok', timestamp: expect.any(String) });
  });

  it('/api/auth/login should fail with invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'invalid@ardaca.com', password: 'incorrect' })
      .expect(401);
  });
});
