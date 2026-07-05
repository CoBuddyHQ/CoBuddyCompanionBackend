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
    completeModule(companionId: string, moduleId: string, score?: number): Promise<{
        moduleId: string;
        message: string;
        certificateUrl: any;
    }>;
    private getDefaultModules;
}
