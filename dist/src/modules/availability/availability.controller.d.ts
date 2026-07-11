import { AvailabilityService } from './availability.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    getSlots(c: JwtPayload): Promise<{
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
    addSlot(c: JwtPayload, dto: any): Promise<{
        slotId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
    updateSlot(c: JwtPayload, slotId: string, dto: any): Promise<{
        slotId: string;
        startTime: string;
        endTime: string;
    }>;
    deleteSlot(c: JwtPayload, slotId: string): Promise<{
        message: string;
    }>;
    addRecurring(c: JwtPayload, dto: any): Promise<{
        created: number;
        message: string;
    }>;
    blockTime(c: JwtPayload, dto: any): Promise<{
        blockId: string;
        date: string;
        reason: string;
        message: string;
    }>;
    setVacationMode(c: JwtPayload, dto: any): Promise<{
        enabled: boolean;
        startDate: string;
        endDate: string;
        message: string;
    }>;
}
