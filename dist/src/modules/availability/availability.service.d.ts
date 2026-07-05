import { PrismaService } from '../../prisma/prisma.service';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getSchedule(companionId: string): Promise<{
        slots: {
            id: string;
            createdAt: Date;
            companionId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }>;
    updateSchedule(companionId: string, dto: any): Promise<{
        slots: {
            id: string;
            createdAt: Date;
            companionId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }>;
    getHolidays(companionId: string): Promise<{
        holidays: {
            id: string;
            createdAt: Date;
            companionId: string;
            date: Date;
            note: string | null;
        }[];
    }>;
    setHolidays(companionId: string, dto: any): Promise<{
        holidays: {
            id: string;
            createdAt: Date;
            companionId: string;
            date: Date;
            note: string | null;
        }[];
    }>;
}
