import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    phone: string;
    accountStatus: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<JwtPayload>;
}
export {};
