import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix & versioning
  app.setGlobalPrefix('api/v1');

  // Validation pipe — strict mode
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CoBuddy Companion API')
    .setDescription(
      'Complete backend for CoBuddy Companion App. ' +
      'All endpoints match frontend interfaces exactly (store.types.ts + endpoints.ts). ' +
      'Zero frontend changes required.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'companion-jwt',
    )
    .addTag('Auth', 'OTP, PIN, Biometric, JWT')
    .addTag('Profile', 'Companion profile management')
    .addTag('KYC', 'Application & verification flow')
    .addTag('Availability', 'Slot management')
    .addTag('Requests', 'Booking requests inbox')
    .addTag('Sessions', 'Session lifecycle')
    .addTag('Safety', 'SOS, Timer, Trusted contacts')
    .addTag('Earnings', 'Earnings, Payouts, Invoices')
    .addTag('Reviews', 'Reviews & Trust score')
    .addTag('Support', 'Tickets, Disputes, Help')
    .addTag('Account', 'Settings & account management')
    .addTag('Notifications', 'In-app notifications')
    .addTag('Dashboard', 'Home dashboard data')
    .addTag('Training', 'Training modules')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log(`🚀 CoBuddy Companion Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
