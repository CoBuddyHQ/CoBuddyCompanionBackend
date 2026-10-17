import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface BookingStatusSyncPayload {
  customerBookingId: string;
  status: 'accepted' | 'declined' | 'counter_proposed' | 'in_progress' | 'completed' | 'cancelled';
  sessionPassCode?: string;
  passCode?: string;
  reason?: string;
  newStart?: string;
  newEnd?: string;
  companionId?: string;
  sessionId?: string;
  companionEarnings?: number;
}

@Injectable()
export class InternalBridgeService {
  private readonly logger = new Logger(InternalBridgeService.name);

  private get customerApiUrl(): string {
    return (process.env.CUSTOMER_API_URL || 'http://localhost:4002').replace(/\/+$/, '');
  }

  private get internalSecret(): string {
    return process.env.INTERNAL_SERVICE_SECRET || '';
  }

  /**
   * Dispatches authenticated S2S status synchronization callback to Customer Backend.
   * Includes X-Internal-Service-Key, X-Correlation-Id, and 5000ms timeout.
   */
  async syncBookingStatus(payload: BookingStatusSyncPayload): Promise<boolean> {
    if (!this.internalSecret) {
      this.logger.error('[S2S Bridge] No internal service secret is configured; status sync was not sent');
      return false;
    }

    const correlationId = crypto.randomUUID();
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Key': this.internalSecret,
      'X-Correlation-Id': correlationId,
    };

    // Ensure sessionPassCode and passCode are synced interchangeably
    const body = {
      ...payload,
      passCode: payload.sessionPassCode || payload.passCode,
      sessionPassCode: payload.sessionPassCode || payload.passCode,
    };

    const primaryUrl = `${this.customerApiUrl}/api/v1/internal/bookings/sync-status`;
    const fallbackUrl = `${this.customerApiUrl}/api/v1/internal/bookings/${encodeURIComponent(payload.customerBookingId)}/status-update`;

    this.logger.log(
      `[S2S Bridge Outbound] [${correlationId}] Syncing status '${payload.status}' for booking ${payload.customerBookingId} to ${primaryUrl}`
    );

    try {
      let res = await fetch(primaryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 404) {
        this.logger.log(`[S2S Bridge] Primary route returned 404, falling back to ${fallbackUrl}`);
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        this.logger.warn(
          `[S2S Bridge] [${correlationId}] Customer backend returned HTTP ${res.status}: ${errorText}`
        );
        return false;
      }

      this.logger.log(
        `[S2S Bridge] [${correlationId}] Successfully synced '${payload.status}' for booking ${payload.customerBookingId}`
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `[S2S Bridge] [${correlationId}] Network/timeout error syncing status to Customer Backend: ${err.message}`
      );
      return false;
    }
  }
}
