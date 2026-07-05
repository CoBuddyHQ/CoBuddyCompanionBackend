export declare class SendOtpDto {
    phone: string;
    deviceId?: string;
}
export declare class VerifyOtpDto {
    phone: string;
    otp: string;
    deviceId?: string;
    deviceName?: string;
}
export declare class SetPinDto {
    pin: string;
}
export declare class VerifyPinDto {
    pin: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class BiometricEnrollDto {
    deviceId: string;
    publicKey: string;
}
export declare class LogoutDto {
    deviceId?: string;
}
