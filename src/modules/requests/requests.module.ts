import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { InternalRequestsController } from './internal-requests.controller';
import { RequestsService } from './requests.service';
import { RequestSimulatorService } from './request-simulator.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RequestsController, InternalRequestsController],
  providers: [RequestsService, RequestSimulatorService],
  exports: [RequestsService],
})
export class RequestsModule {}

