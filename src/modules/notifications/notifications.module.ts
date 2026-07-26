import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService],
  exports: [FcmService, NotificationsService],
})
export class NotificationsModule {}

