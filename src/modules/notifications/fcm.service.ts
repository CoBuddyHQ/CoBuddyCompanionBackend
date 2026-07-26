/**
 * CoBuddy Backend — FCM Push Notification Sender
 * Sends push notifications via Firebase Admin SDK.
 *
 * Development: Works without Firebase credentials (logs only)
 * Production:  Fill FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
 */

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private firebaseAdmin: any = null;
  private initialized = false;

  constructor() {
    this.initFirebase();
  }

  private async initFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase Admin SDK not configured — FCM push notifications disabled. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env to enable.'
      );
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.firebaseAdmin = admin;
      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized ✓');
    } catch (err) {
      this.logger.warn(`Firebase Admin SDK init failed: ${err}`);
    }
  }

  /**
   * Send push notification to a single FCM token.
   */
  async sendToToken(
    token: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<boolean> {
    if (!this.initialized || !this.firebaseAdmin) {
      this.logger.debug(`[FCM Mock] → "${payload.title}": ${payload.body}`);
      return true; // Graceful no-op in development
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        token,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'cobuddy_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      this.logger.log(`FCM sent: ${response}`);
      return true;
    } catch (err: any) {
      this.logger.error(`FCM send error: ${err?.message}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple tokens (batch).
   * Max 500 tokens per batch (FCM limit).
   */
  async sendToMultiple(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!tokens.length) return { successCount: 0, failureCount: 0 };

    if (!this.initialized || !this.firebaseAdmin) {
      this.logger.debug(`[FCM Mock Batch] ${tokens.length} tokens → "${payload.title}"`);
      return { successCount: tokens.length, failureCount: 0 };
    }

    try {
      const messages = tokens.map((token) => ({
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        token,
      }));

      const response = await this.firebaseAdmin.messaging().sendEach(messages);
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (err: any) {
      this.logger.error(`FCM batch send error: ${err?.message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send a booking request notification to companion.
   */
  async notifyNewBookingRequest(
    companionTokens: string[],
    requestData: { requestId: string; customerInitials: string; earning: number }
  ) {
    return this.sendToMultiple(companionTokens, {
      title: '🔔 New Booking Request',
      body: `${requestData.customerInitials} wants to book you — ₹${requestData.earning}`,
      data: {
        type: 'new_booking_request',
        requestId: requestData.requestId,
      },
    });
  }

  /**
   * Send session start reminder to companion.
   */
  async notifySessionReminder(
    companionTokens: string[],
    sessionData: { sessionId: string; minutesBefore: number }
  ) {
    return this.sendToMultiple(companionTokens, {
      title: '⏰ Session Reminder',
      body: `Your session starts in ${sessionData.minutesBefore} minutes`,
      data: {
        type: 'session_reminder',
        sessionId: sessionData.sessionId,
      },
    });
  }

  /**
   * Send payout notification to companion.
   */
  async notifyPayoutProcessed(
    token: string,
    payoutData: { amount: number; transactionId: string }
  ) {
    return this.sendToToken(token, {
      title: '💰 Payout Processed',
      body: `₹${payoutData.amount} has been transferred to your account`,
      data: {
        type: 'payout_processed',
        transactionId: payoutData.transactionId,
      },
    });
  }
}
