import { AvailabilityService } from './availability.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    getAvailability(c: JwtPayload): Promise<{
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
    setLiveAvailable(c: JwtPayload, isAvailable: boolean): Promise<{
        success: boolean;
        isAvailable: boolean;
    }>;
    setVacationMode(c: JwtPayload, dto: any): Promise<{
        id: string;
        updatedAt: Date;
        companionId: string;
        enabled: boolean;
        awayFrom: string | null;
        returnOn: string | null;
    }>;
    toggleDay(c: JwtPayload, day: string): Promise<{
        id: string;
        createdAt: Date;
        active: boolean;
        day: string;
        companionId: string;
        times: string;
    }>;
    setDayTimes(c: JwtPayload, day: string, dto: {
        times?: string;
        startTime?: string;
        endTime?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        active: boolean;
        day: string;
        companionId: string;
        times: string;
    }>;
    addOverride(c: JwtPayload, dto: any): Promise<{
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
    removeOverride(c: JwtPayload, id: string): Promise<{
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
    addSlot(c: JwtPayload, dto: any): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
    updateSlot(c: JwtPayload, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
    removeSlot(c: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        repeat: boolean;
        companionId: string;
        startTime: string;
        endTime: string;
        date: string;
    }>;
}
