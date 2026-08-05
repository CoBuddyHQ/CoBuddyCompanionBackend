"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TrainingService = class TrainingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getModules(companionId) {
        const modules = await this.prisma.trainingModule.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                completions: { where: { companionId } },
            },
        });
        if (!modules.length) {
            return { modules: this.getDefaultModules() };
        }
        return {
            modules: modules.map(m => ({
                moduleId: m.id,
                title: m.title,
                description: m.takeaways[0] ?? m.title,
                category: 'safety',
                durationMinutes: parseInt(m.duration) || 20,
                isRequired: m.required,
                isCompleted: m.completions.length > 0,
                completedAt: m.completions[0]?.completedAt?.toISOString() ?? null,
            })),
        };
    }
    async getModule(moduleId) {
        const mod = await this.prisma.trainingModule.findUnique({ where: { id: moduleId } });
        if (!mod) {
            const defaults = this.getDefaultModules();
            const found = defaults.find(d => d.moduleId === moduleId);
            return found ?? { moduleId, title: 'Training Module', body: [], takeaways: [], isCompleted: false };
        }
        return {
            moduleId: mod.id,
            title: mod.title,
            duration: mod.duration,
            required: mod.required,
            body: mod.body,
            takeaways: mod.takeaways,
        };
    }
    async completeModule(companionId, moduleId, score) {
        const existing = await this.prisma.trainingModule.findUnique({ where: { id: moduleId } });
        if (existing) {
            const found = await this.prisma.moduleCompletion.findFirst({ where: { companionId, moduleId } });
            if (found) {
                await this.prisma.moduleCompletion.update({
                    where: { id: found.id },
                    data: { score, completedAt: new Date(), completionStatus: 'completed' },
                });
            }
            else {
                await this.prisma.moduleCompletion.create({
                    data: { companionId, moduleId, moduleName: 'training', score: score ?? 0, completedAt: new Date(), completionStatus: 'completed' },
                });
            }
        }
        return {
            moduleId,
            message: 'Training module completed! Trust score updated.',
            certificateUrl: null,
        };
    }
    getDefaultModules() {
        return [
            { moduleId: 'tm-001', title: 'Safety & Boundaries', description: 'Core safety protocols', category: 'safety', durationMinutes: 30, isRequired: true, isCompleted: false, completedAt: null },
            { moduleId: 'tm-002', title: 'Communication Skills', description: 'How to engage with customers', category: 'communication', durationMinutes: 20, isRequired: true, isCompleted: false, completedAt: null },
            { moduleId: 'tm-003', title: 'CoBuddy Community Guidelines', description: 'Platform rules and standards', category: 'guidelines', durationMinutes: 15, isRequired: true, isCompleted: false, completedAt: null },
            { moduleId: 'tm-004', title: 'Venue & Activity Best Practices', description: 'How to choose safe venues', category: 'venues', durationMinutes: 25, isRequired: false, isCompleted: false, completedAt: null },
            { moduleId: 'tm-005', title: 'Earnings & Payouts', description: 'Understanding how you get paid', category: 'earnings', durationMinutes: 10, isRequired: false, isCompleted: false, completedAt: null },
        ];
    }
};
exports.TrainingService = TrainingService;
exports.TrainingService = TrainingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrainingService);
//# sourceMappingURL=training.service.js.map