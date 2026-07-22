export declare class DayScheduleDto {
    day: string;
    active: boolean;
    times: string;
}
export declare class UpdateDefaultHoursDto {
    hours: DayScheduleDto[];
}
export declare class AddDateOverrideDto {
    startDate: string;
    endDate: string;
    reason: string;
    note?: string;
    fullDay: boolean;
    startTime?: string;
    endTime?: string;
}
export declare class AddSlotDto {
    date: string;
    startTime: string;
    endTime: string;
    repeat: boolean;
}
export declare class UpdateSlotDto {
    date?: string;
    startTime?: string;
    endTime?: string;
    repeat?: boolean;
}
export declare class VacationModeDto {
    enabled: boolean;
    awayFrom?: string;
    returnOn?: string;
}
export declare class LiveAvailabilityDto {
    isAvailable: boolean;
}
