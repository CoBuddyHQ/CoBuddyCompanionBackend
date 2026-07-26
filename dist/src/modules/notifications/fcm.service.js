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
var FcmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
let FcmService = FcmService_1 = class FcmService {
    constructor() {
        this.logger = new common_1.Logger(FcmService_1.name);
        this.firebaseAdmin = null;
        this.initialized = false;
        this.initFirebase();
    }
    async initFirebase() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn('Firebase Admin SDK not configured — FCM push notifications disabled. ' +
                'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env to enable.');
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
        }
        catch (err) {
            this.logger.warn(`Firebase Admin SDK init failed: ${err}`);
        }
    }
    async sendToToken(token, payload) {
        if (!this.initialized || !this.firebaseAdmin) {
            this.logger.debug(`[FCM Mock] → "${payload.title}": ${payload.body}`);
            return true;
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
                    priority: 'high',
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
        }
        catch (err) {
            this.logger.error(`FCM send error: ${err?.message}`);
            return false;
        }
    }
    async sendToMultiple(tokens, payload) {
        if (!tokens.length)
            return { successCount: 0, failureCount: 0 };
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
        }
        catch (err) {
            this.logger.error(`FCM batch send error: ${err?.message}`);
            return { successCount: 0, failureCount: tokens.length };
        }
    }
    async notifyNewBookingRequest(companionTokens, requestData) {
        return this.sendToMultiple(companionTokens, {
            title: '🔔 New Booking Request',
            body: `${requestData.customerInitials} wants to book you — ₹${requestData.earning}`,
            data: {
                type: 'new_booking_request',
                requestId: requestData.requestId,
            },
        });
    }
    async notifySessionReminder(companionTokens, sessionData) {
        return this.sendToMultiple(companionTokens, {
            title: '⏰ Session Reminder',
            body: `Your session starts in ${sessionData.minutesBefore} minutes`,
            data: {
                type: 'session_reminder',
                sessionId: sessionData.sessionId,
            },
        });
    }
    async notifyPayoutProcessed(token, payoutData) {
        return this.sendToToken(token, {
            title: '💰 Payout Processed',
            body: `₹${payoutData.amount} has been transferred to your account`,
            data: {
                type: 'payout_processed',
                transactionId: payoutData.transactionId,
            },
        });
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = FcmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FcmService);
//# sourceMappingURL=fcm.service.js.map