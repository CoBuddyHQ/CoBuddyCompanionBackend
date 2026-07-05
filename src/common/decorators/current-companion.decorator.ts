import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts authenticated companion from JWT payload.
 * Usage: @CurrentCompanion() companion: JwtPayload
 */
export const CurrentCompanion = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const companion = request.user;
    return data ? companion?.[data] : companion;
  },
);
