import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { PublicCompanionController } from './public-companion.controller';
import { ProfileService } from './profile.service';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [KycModule],
  controllers: [ProfileController, PublicCompanionController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
