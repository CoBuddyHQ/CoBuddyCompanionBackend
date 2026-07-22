import { PrismaService } from '../../prisma/prisma.service';
export declare class TrainingService {
    private prisma;
    constructor(prisma: PrismaService);
    getModules(companionId: string): Promise<{
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
    completeModule(companionId: string, moduleId: string, score?: number): Promise<{
        moduleId: string;
        message: string;
        certificateUrl: any;
    }>;
    private getDefaultModules;
}
