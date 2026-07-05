import { TrainingService } from './training.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class TrainingController {
    private readonly trainingService;
    constructor(trainingService: TrainingService);
    getModules(c: JwtPayload): Promise<{
        modules: {
            moduleId: string;
            title: string;
            description: string;
            category: string;
            durationMinutes: number;
            isRequired: boolean;
            isCompleted: boolean;
            completedAt: any;
            sortOrder: number;
        }[];
    }>;
    getModule(moduleId: string): Promise<{
        moduleId: string;
        title: string;
        description: string;
        category: string;
        durationMinutes: number;
        isRequired: boolean;
        isCompleted: boolean;
        completedAt: any;
        sortOrder: number;
    } | {
        moduleId: string;
        title: string;
        content: any[];
        isCompleted: false;
        description?: undefined;
        category?: undefined;
        durationMinutes?: undefined;
        isRequired?: undefined;
    } | {
        moduleId: string;
        title: string;
        description: string;
        category: string;
        content: any;
        durationMinutes: number;
        isRequired: boolean;
        isCompleted?: undefined;
    }>;
    completeModule(c: JwtPayload, moduleId: string, dto: any): Promise<{
        moduleId: string;
        message: string;
        certificateUrl: any;
    }>;
}
