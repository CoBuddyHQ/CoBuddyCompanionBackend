import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getRoot() {
    return {
      service: 'CoBuddy Companion Backend API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')

  async getHealth() {
    let dbStatus = 'disconnected';
    let isHealthy = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      isHealthy = true;
    } catch {
      dbStatus = 'disconnected';
    }

    const payload = {
      status: isHealthy ? 'ok' : 'unhealthy',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'cobuddy-companion-backend',
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
