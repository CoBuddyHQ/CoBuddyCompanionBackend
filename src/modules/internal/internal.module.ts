import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { InternalBridgeService } from './internal-bridge.service';
import { InternalServiceGuard } from './internal-service.guard';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InternalController],
  providers: [InternalService, InternalBridgeService, InternalServiceGuard],
  exports: [InternalService, InternalBridgeService, InternalServiceGuard],
})
export class InternalModule {}
