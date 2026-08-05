import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService, NotificationsGateway],
  exports: [FcmService, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

