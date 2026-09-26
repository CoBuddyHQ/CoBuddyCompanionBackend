import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaService } from './prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn'] : ['error', 'warn', 'log', 'debug'],
    rawBody: true,
  });

  // ── SHUTDOWN HOOKS ────────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── SECURITY & COMPRESSION ────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : (isProd ? [] : ['*']);

  if (isProd && allowedOrigins.length === 0) {
    logger.warn('⚠️  CORS_ORIGIN is not set in production — all cross-origin requests will be blocked.');
  }

  app.enableCors({
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── GLOBAL PREFIX ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // ── VALIDATION PIPE ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── GLOBAL FILTERS & INTERCEPTORS ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // ── SWAGGER — only in non-production ─────────────────────────────────────
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('CoBuddy Companion API')
      .setDescription(
        'Complete backend for CoBuddy Companion App. ' +
        'All endpoints match frontend interfaces exactly (store.types.ts + endpoints.ts).',
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
    logger.log('📚 Swagger OpenAPI Docs: enabled (dev only)');
  } else {
    logger.log('🔒 Swagger disabled in production');
  }

  // ── DB HEALTH PROBE ───────────────────────────────────────────────────────
  try {
    const prisma = app.get(PrismaService);
    await prisma.$queryRaw`SELECT 1`;
    logger.log('✅ Database connection verified');
  } catch (err) {
    logger.error('❌ Database connection failed at startup — aborting', err);
    process.exit(1);
  }

  // ── START ──────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  logger.log(`🚀 CoBuddy Companion Backend running on: http://localhost:${port}`);
  if (!isProd) {
    logger.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
