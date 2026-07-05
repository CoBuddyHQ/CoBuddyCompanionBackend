import { AvailabilityService } from './availability.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    getSchedule(c: JwtPayload): Promise<{
        slots: {
            id: string;
            createdAt: Date;
            companionId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }>;
    updateSchedule(c: JwtPayload, dto: any): Promise<{
        slots: {
            id: string;
            createdAt: Date;
            companionId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }>;
    getHolidays(c: JwtPayload): Promise<{
        holidays: {
            id: string;
            createdAt: Date;
            companionId: string;
            date: Date;
            note: string | null;
        }[];
    }>;
    setHolidays(c: JwtPayload, dto: any): Promise<{
        holidays: {
            id: string;
            createdAt: Date;
            companionId: string;
            date: Date;
            note: string | null;
        }[];
    }>;
}
