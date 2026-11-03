import { Module, forwardRef } from '@nestjs/common';
import { InternalServiceGuard } from '../../common/guards/internal-service.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { InternalBridgeService } from './internal-bridge.service';

@Module({
  imports: [PrismaModule, NotificationsModule, forwardRef(() => SessionsModule)],
  controllers: [InternalController],
  providers: [InternalService, InternalBridgeService, InternalServiceGuard],
  exports: [InternalService, InternalBridgeService, InternalServiceGuard],
})
export class InternalModule {}

