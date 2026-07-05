import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads' }),
    ProfileModule,
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
