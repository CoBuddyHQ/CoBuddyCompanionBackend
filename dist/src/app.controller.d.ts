import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): Promise<{
        status: string;
        database: string;
        uptime: number;
        timestamp: string;
        service: string;
    }>;
}
