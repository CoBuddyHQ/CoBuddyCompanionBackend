import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionGateway } from './session.gateway';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InternalModule } from '../internal/internal.module';

@Module({
  imports: [AuthModule, NotificationsModule, InternalModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionGateway],
  exports: [SessionsService],
})
export class SessionsModule {}
