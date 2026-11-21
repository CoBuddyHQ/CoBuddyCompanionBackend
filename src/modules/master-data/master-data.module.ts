import { Module } from '@nestjs/common';
import { MasterDataController, PublicMasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

@Module({
  controllers: [MasterDataController, PublicMasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
