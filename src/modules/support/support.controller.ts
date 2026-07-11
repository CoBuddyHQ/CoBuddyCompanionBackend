import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Support')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets') @ApiOperation({ summary: 'Get support tickets' })
  getTickets(@CurrentCompanion() c: JwtPayload) { return this.supportService.getTickets(c.sub); }

  @Get('tickets/:ticketId') @ApiOperation({ summary: 'Get ticket detail' })
  getTicket(@CurrentCompanion() c: JwtPayload, @Param('ticketId') id: string) { return this.supportService.getTicket(c.sub, id); }

  @Post('tickets/create') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Create support ticket' })
  createTicket(@CurrentCompanion() c: JwtPayload, @Body() dto: any) { return this.supportService.createTicket(c.sub, dto); }

  @Get('chat/:ticketId') @ApiOperation({ summary: 'Get chat history for a ticket' })
  getChatHistory(@CurrentCompanion() c: JwtPayload, @Param('ticketId') id: string) { return this.supportService.getChatHistory(c.sub, id); }

  @Post('tickets/:ticketId/messages') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Reply to ticket' })
  addTicketMessage(@CurrentCompanion() c: JwtPayload, @Param('ticketId') id: string, @Body() dto: any) { return this.supportService.addTicketMessage(c.sub, id, dto.message); }

  @Get('disputes') @ApiOperation({ summary: 'Get disputes' })
  getDisputes(@CurrentCompanion() c: JwtPayload) { return this.supportService.getDisputes(c.sub); }

  @Get('disputes/:disputeId') @ApiOperation({ summary: 'Get dispute detail' })
  getDispute(@CurrentCompanion() c: JwtPayload, @Param('disputeId') id: string) { return this.supportService.getDispute(c.sub, id); }

  @Post('disputes') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'File a dispute' })
  createDispute(@CurrentCompanion() c: JwtPayload, @Body() dto: any) { return this.supportService.createDispute(c.sub, dto); }

  @Post('disputes/:disputeId/appeal') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Appeal a dispute decision' })
  appealDispute(@CurrentCompanion() c: JwtPayload, @Param('disputeId') id: string, @Body() dto: any) { return this.supportService.appealDispute(c.sub, id, dto); }

  @Post('disputes/:disputeId/evidence') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Upload dispute evidence' })
  uploadDisputeEvidence(@CurrentCompanion() c: JwtPayload, @Param('disputeId') id: string, @Body() dto: any) { return this.supportService.uploadDisputeEvidence(c.sub, id, dto.evidenceUrls); }

  @Get('help/categories') @ApiOperation({ summary: 'Get help categories' })
  getHelpArticles() { return this.supportService.getHelpArticles(); }

  @Get('help/:articleId') @ApiOperation({ summary: 'Get help article' })
  getHelpArticle(@Param('articleId') id: string) { return this.supportService.getHelpArticle(id); }
}
