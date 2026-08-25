import type { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(res: Response): Promise<Response<any, Record<string, any>>>;
}
