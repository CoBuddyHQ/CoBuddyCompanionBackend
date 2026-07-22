export declare class OnboardingSyncDto {
    language?: string;
    locationEnabled?: boolean;
    notificationsEnabled?: boolean;
    termsAccepted?: boolean;
    safetyRulesAccepted?: boolean;
}
export declare class UpdatePrivacyDto {
    showAge?: boolean;
    allowPromo?: boolean;
    showInSearch?: boolean;
}
export declare class UpdateNotificationPrefsDto {
    new_booking_push?: boolean;
    new_booking_email?: boolean;
    cancellations?: boolean;
    session_reminder?: boolean;
    safety_alerts?: boolean;
    payout_confirm?: boolean;
    earnings_summary?: boolean;
    news_tips?: boolean;
    promo_email?: boolean;
}
