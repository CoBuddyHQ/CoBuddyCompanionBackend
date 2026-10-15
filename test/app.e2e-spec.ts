import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('CoBuddy Companion API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
      ],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('online');
      });
  });


  describe('S2S Internal Companion Requests API', () => {
    it('rejects internal booking request creation when x-internal-token is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/internal/companion/requests')
        .send({ bookingId: 'test-booking-id' })
        .expect(401);
    });

    it('rejects internal booking request creation when x-internal-token is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/internal/companion/requests')
        .set('x-internal-token', 'wrong-internal-token')
        .send({ bookingId: 'test-booking-id' })
        .expect(401);
    });

    it('rejects internal booking request with 400 when required payload fields are missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/internal/companion/requests')
        .set('x-internal-token', process.env.INTERNAL_SERVICE_TOKEN || 'cobuddy-internal-service-s2s-token-2026')
        .send({ bookingId: 'test-booking-id' })
        .expect(400);
    });
  });
});

