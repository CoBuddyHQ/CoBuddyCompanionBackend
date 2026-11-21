import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MasterDataService {
  private readonly logger = new Logger(MasterDataService.name);
  private cache: any = null;
  private expiresAt = 0;

  async getBundle(refresh?: boolean) {
    const now = Date.now();
    if (!refresh && this.cache && this.expiresAt > now) {
      return this.cache;
    }

    const adminUrl = (process.env.ADMIN_API_URL || 'http://admin-backend:4000').replace(/\/+$/, '');
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';

    try {
      const res = await fetch(`${adminUrl}/api/internal/master-data/bundle`, {
        method: 'GET',
        headers: {
          'X-Internal-Service-Key': internalSecret,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const body: any = await res.json();
        const data = body?.data || body;
        this.cache = data;
        this.expiresAt = now + 30 * 1000;
        return data;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch master data bundle from Admin: ${err?.message}`);
    }

    if (this.cache) {
      return this.cache;
    }

    return {
      cities: [],
      areas: [],
      interests: [],
      languages: [],
    };
  }
}
