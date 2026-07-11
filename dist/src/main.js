"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const compression = require('compression');
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_interceptor_1.ResponseInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('CoBuddy Companion API')
        .setDescription('Complete backend for CoBuddy Companion App. ' +
        'All endpoints match frontend interfaces exactly (store.types.ts + endpoints.ts). ' +
        'Zero frontend changes required.')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'companion-jwt')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const port = process.env.PORT ?? 4001;
    await app.listen(port);
    console.log(`🚀 CoBuddy Companion Backend running on: http://localhost:${port}`);
    console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map