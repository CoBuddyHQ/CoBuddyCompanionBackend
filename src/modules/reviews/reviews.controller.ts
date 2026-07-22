import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentCompanion } from '../../common/decorators/current-companion.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Reviews')
@ApiBearerAuth('companion-jwt')
@UseGuards(JwtAuthGuard)
@Controller('companion')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews') @ApiOperation({ summary: 'Get all reviews — Endpoints.REVIEWS.LIST' })
  getReviews(@CurrentCompanion() c: JwtPayload, @Query('page') page = 1) {
    return this.reviewsService.getReviews(c.sub, Number(page));
  }

  @Get('reviews/:reviewId') @ApiOperation({ summary: 'Get review detail — Endpoints.REVIEWS.DETAIL' })
  getReview(@CurrentCompanion() c: JwtPayload, @Param('reviewId') id: string) {
    return this.reviewsService.getReview(c.sub, id);
  }

  @Post('reviews/:reviewId/report')
  @ApiOperation({ summary: 'Report a review' })
  reportReview(@CurrentCompanion() c: JwtPayload, @Param('reviewId') id: string) {
    return this.reviewsService.reportReview(c.sub, id);
  }

  @Post('reviews/:reviewId/reply')
  @ApiOperation({ summary: 'Reply to a review' })
  replyToReview(
    @CurrentCompanion() c: JwtPayload,
    @Param('reviewId') id: string,
    @Body('reply') reply: string
  ) {
    return this.reviewsService.replyToReview(c.sub, id, reply);
  }

  @Get('trust/score') @ApiOperation({ summary: 'Get trust score — Endpoints.REVIEWS.TRUST_SCORE' })
  getTrustScore(@CurrentCompanion() c: JwtPayload) {
    return this.reviewsService.getTrustScore(c.sub);
  }

  @Get('trust/tasks') @ApiOperation({ summary: 'Get trust improvement tasks — Endpoints.REVIEWS.TRUST_TASKS' })
  getTrustTasks(@CurrentCompanion() c: JwtPayload) {
    return this.reviewsService.getTrustTasks(c.sub);
  }

  @Get('trust/badges') @ApiOperation({ summary: 'Get earned badges — Endpoints.REVIEWS.BADGES' })
  getBadges(@CurrentCompanion() c: JwtPayload) {
    return this.reviewsService.getBadges(c.sub);
  }
}
