import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { AuthModule } from '../auth/auth.module';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@Module({
  imports: [AuthModule],
  controllers: [SupportController],
  providers: [SupportService, SupportGateway, WsJwtGuard],
  exports: [SupportService],
})
export class SupportModule {}
