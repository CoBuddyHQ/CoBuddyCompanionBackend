import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestSimulatorService } from './request-simulator.service';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestSimulatorService],
  exports: [RequestsService],
})
export class RequestsModule {}

