export declare class FcmService {
    private readonly logger;
    private firebaseAdmin;
    private initialized;
    constructor();
    private initFirebase;
    sendToToken(token: string, payload: {
        title: string;
        body: string;
        data?: Record<string, string>;
    }): Promise<boolean>;
    sendToMultiple(tokens: string[], payload: {
        title: string;
        body: string;
        data?: Record<string, string>;
    }): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    notifyNewBookingRequest(companionTokens: string[], requestData: {
        requestId: string;
        customerInitials: string;
        earning: number;
    }): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    notifySessionReminder(companionTokens: string[], sessionData: {
        sessionId: string;
        minutesBefore: number;
    }): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    notifyPayoutProcessed(token: string, payoutData: {
        amount: number;
        transactionId: string;
    }): Promise<boolean>;
}
