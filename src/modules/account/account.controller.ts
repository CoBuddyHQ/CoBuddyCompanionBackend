import { Controller, Get, Put, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Account')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('settings') @ApiOperation({ summary: 'Get account settings' })
  getSettings(@CurrentCompanion() c: JwtPayload) {
    return this.accountService.getAccountSettings(c.sub);
  }

  @Put('settings') @ApiOperation({ summary: 'Update account settings' })
  updateSettings(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.accountService.updateAccountSettings(c.sub, dto);
  }

  @Delete('delete') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@CurrentCompanion() c: JwtPayload, @Body() dto: any) {
    return this.accountService.deleteAccount(c.sub, dto?.reason);
  }
}
