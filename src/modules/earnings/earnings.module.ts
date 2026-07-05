import { Module } from '@nestjs/common';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';

@Module({
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
