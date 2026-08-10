import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { ProgressEngineService } from './progress-engine.service';

@Module({ 
  controllers: [KycController], 
  providers: [KycService, ProgressEngineService],
  exports: [KycService, ProgressEngineService]
})
export class KycModule {}
