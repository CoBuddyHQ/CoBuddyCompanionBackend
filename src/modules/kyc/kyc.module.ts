import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { ProgressEngineService } from './progress-engine.service';
import { InternalModule } from '../internal/internal.module';

@Module({ 
  imports: [InternalModule],
  controllers: [KycController], 
  providers: [KycService, ProgressEngineService],
  exports: [KycService, ProgressEngineService]
})
export class KycModule {}
