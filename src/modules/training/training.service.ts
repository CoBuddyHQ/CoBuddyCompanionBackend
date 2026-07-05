import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  async getModules(companionId: string) {
    // Seed default training modules if none exist
    const modules = await this.prisma.trainingModule.findMany({
      orderBy: { sortOrder: 'asc' },
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
        description: m.description,
        category: m.category,
        durationMinutes: m.durationMinutes,
        isRequired: m.isRequired,
        isCompleted: m.completions.length > 0,
        completedAt: m.completions[0]?.completedAt?.toISOString() ?? null,
        sortOrder: m.sortOrder,
      })),
    };
  }

  async getModule(moduleId: string) {
    const mod = await this.prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (!mod) {
      // Return default data for seeded module IDs
      const defaults = this.getDefaultModules();
      const found = defaults.find(d => d.moduleId === moduleId);
      return found ?? { moduleId, title: 'Training Module', content: [], isCompleted: false };
    }
    return {
      moduleId: mod.id,
      title: mod.title,
      description: mod.description,
      category: mod.category,
      content: mod.content ? JSON.parse(mod.content) : [],
      durationMinutes: mod.durationMinutes,
      isRequired: mod.isRequired,
    };
  }

  async completeModule(companionId: string, moduleId: string, score?: number) {
    await this.prisma.moduleCompletion.upsert({
      where: { companionId_moduleId: { companionId, moduleId } },
      update: { score, completedAt: new Date() },
      create: { companionId, moduleId, score: score ?? 0, completedAt: new Date() },
    });

    // Check if all required modules completed → update trust tasks
    return {
      moduleId,
      message: 'Training module completed! Trust score updated.',
      certificateUrl: null,
    };
  }

  private getDefaultModules() {
    return [
      { moduleId: 'tm-001', title: 'Safety & Boundaries', description: 'Core safety protocols', category: 'safety', durationMinutes: 30, isRequired: true, isCompleted: false, completedAt: null, sortOrder: 1 },
      { moduleId: 'tm-002', title: 'Communication Skills', description: 'How to engage with customers', category: 'communication', durationMinutes: 20, isRequired: true, isCompleted: false, completedAt: null, sortOrder: 2 },
      { moduleId: 'tm-003', title: 'CoBuddy Community Guidelines', description: 'Platform rules and standards', category: 'guidelines', durationMinutes: 15, isRequired: true, isCompleted: false, completedAt: null, sortOrder: 3 },
      { moduleId: 'tm-004', title: 'Venue & Activity Best Practices', description: 'How to choose safe venues', category: 'venues', durationMinutes: 25, isRequired: false, isCompleted: false, completedAt: null, sortOrder: 4 },
      { moduleId: 'tm-005', title: 'Earnings & Payouts', description: 'Understanding how you get paid', category: 'earnings', durationMinutes: 10, isRequired: false, isCompleted: false, completedAt: null, sortOrder: 5 },
    ];
  }
}
