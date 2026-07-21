import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;         // companionId
  phone: string;
  accountStatus: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'companion-jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const companion = await this.prisma.companion.findUnique({
      where: { id: payload.sub },
      select: { id: true, phone: true, accountStatus: true, deletedAt: true },
    });
    if (!companion || companion.deletedAt) {
      throw new UnauthorizedException('Companion not found or deleted');
    }
    if (companion.accountStatus === 'deleted') {
      throw new UnauthorizedException('Account deleted');
    }
    return {
      sub: companion.id,
      phone: companion.phone,
      accountStatus: companion.accountStatus,
    };
  }
}
