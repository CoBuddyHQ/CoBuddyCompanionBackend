import { PrismaService } from '../../prisma/prisma.service';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getSlots(companionId: string): Promise<{
        slots: {
            slotId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
        blockedTimes: {
            blockId: string;
            date: string;
            reason: string;
        }[];
        vacationMode: {
            enabled: boolean;
            startDate: string;
            endDate: string;
        };
    }>;
    addSlot(companionId: string, dto: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }): Promise<{
        slotId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
    updateSlot(companionId: string, slotId: string, dto: {
        startTime?: string;
        endTime?: string;
    }): Promise<{
        slotId: string;
        startTime: string;
        endTime: string;
    }>;
    deleteSlot(companionId: string, slotId: string): Promise<{
        message: string;
    }>;
    addRecurring(companionId: string, dto: {
        pattern: string;
        slots: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }): Promise<{
        created: number;
        message: string;
    }>;
    blockTime(companionId: string, dto: {
        date: string;
        reason?: string;
    }): Promise<{
        blockId: string;
        date: string;
        reason: string;
        message: string;
    }>;
    setVacationMode(companionId: string, dto: {
        enabled: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        enabled: boolean;
        startDate: string;
        endDate: string;
        message: string;
    }>;
}
