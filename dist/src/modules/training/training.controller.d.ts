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
    } | {
        moduleId: string;
        title: string;
        body: any[];
        takeaways: any[];
        isCompleted: false;
        duration?: undefined;
        required?: undefined;
    } | {
        moduleId: string;
        title: string;
        duration: string;
        required: boolean;
        body: string[];
        takeaways: string[];
        isCompleted?: undefined;
    }>;
    completeModule(c: JwtPayload, moduleId: string, dto: any): Promise<{
        moduleId: string;
        message: string;
        certificateUrl: any;
    }>;
}
