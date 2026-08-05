import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  async getModules(companionId: string) {
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

  async getModule(moduleId: string) {
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

  async completeModule(companionId: string, moduleId: string, score?: number) {
    // Upsert completion entry
    const existing = await this.prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (existing) {
      const found = await this.prisma.moduleCompletion.findFirst({ where: { companionId, moduleId } });
      if (found) {
        await this.prisma.moduleCompletion.update({
          where: { id: found.id },
          data: { score, completedAt: new Date(), completionStatus: 'completed' },
        });
      } else {
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

  private getDefaultModules() {
    return [
      { moduleId: 'tm-001', title: 'Safety & Boundaries', description: 'Core safety protocols', category: 'safety', durationMinutes: 30, isRequired: true, isCompleted: false, completedAt: null },
      { moduleId: 'tm-002', title: 'Communication Skills', description: 'How to engage with customers', category: 'communication', durationMinutes: 20, isRequired: true, isCompleted: false, completedAt: null },
      { moduleId: 'tm-003', title: 'CoBuddy Community Guidelines', description: 'Platform rules and standards', category: 'guidelines', durationMinutes: 15, isRequired: true, isCompleted: false, completedAt: null },
      { moduleId: 'tm-004', title: 'Venue & Activity Best Practices', description: 'How to choose safe venues', category: 'venues', durationMinutes: 25, isRequired: false, isCompleted: false, completedAt: null },
      { moduleId: 'tm-005', title: 'Earnings & Payouts', description: 'Understanding how you get paid', category: 'earnings', durationMinutes: 10, isRequired: false, isCompleted: false, completedAt: null },
    ];
  }
}
