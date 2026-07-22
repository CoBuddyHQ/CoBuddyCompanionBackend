import { PrismaService } from '../../prisma/prisma.service';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getAvailability(companionId: string): Promise<{
        isAvailable: boolean;
        vacationMode: {
            enabled: boolean;
            awayFrom: string;
            returnOn: string;
        };
        defaultHours: {
            day: string;
            active: boolean;
            times: string;
        }[];
        dateOverrides: {
            id: string;
            startDate: string;
            endDate: string;
            reason: string;
            note: string;
            fullDay: boolean;
            startTime: string;
            endTime: string;
        }[];
        slots: {
            id: string;
            date: string;
            startTime: string;
            endTime: string;
            repeat: boolean;
        }[];
    }>;
    setLiveAvailable(companionId: string, isAvailable: boolean): Promise<{
        success: boolean;
        isAvailable: boolean;
    }>;
    setVacationMode(companionId: string, dto: {
        enabled: boolean;
        awayFrom?: string;
        returnOn?: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        companionId: string;
        enabled: boolean;
        awayFrom: string | null;
        returnOn: string | null;
    }>;
    toggleDay(companionId: string, day: string): Promise<{
        id: string;
        createdAt: Date;
        active: boolean;
        day: string;
        companionId: string;
        times: string;
    }>;
    setDayTimes(companionId: string, day: string, times: string): Promise<{
        id: string;
        createdAt: Date;
        active: boolean;
        day: string;
        companionId: string;
        times: string;
    }>;
    addOverride(companionId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        companionId: string;
        startDate: string;
        endDate: string;
        reason: string;
        note: string | null;
        fullDay: boolean;
        startTime: string | null;
        endTime: string | null;
    }>;
    removeOverride(companionId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        companionId: string;
        startDate: string;
        endDate: string;
        reason: string;
        note: string | null;
        fullDay: boolean;
        startTime: string | null;
        endTime: string | null;
    }>;
    addSlot(companionId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
    updateSlot(companionId: string, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
    removeSlot(companionId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
}
