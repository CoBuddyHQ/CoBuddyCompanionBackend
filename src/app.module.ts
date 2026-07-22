import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { RequestsModule } from './modules/requests/requests.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SafetyModule } from './modules/safety/safety.module';
import { EarningsModule } from './modules/earnings/earnings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SupportModule } from './modules/support/support.module';
import { AccountModule } from './modules/account/account.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TrainingModule } from './modules/training/training.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProfileModule,
    KycModule,
    AvailabilityModule,
    RequestsModule,
    SessionsModule,
    SafetyModule,
    EarningsModule,
    ReviewsModule,
    SupportModule,
    AccountModule,
    NotificationsModule,
    DashboardModule,
    TrainingModule,
    UploadsModule,
    SettingsModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
