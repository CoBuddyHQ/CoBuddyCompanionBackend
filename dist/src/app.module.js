"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const profile_module_1 = require("./modules/profile/profile.module");
const kyc_module_1 = require("./modules/kyc/kyc.module");
const availability_module_1 = require("./modules/availability/availability.module");
const requests_module_1 = require("./modules/requests/requests.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const safety_module_1 = require("./modules/safety/safety.module");
const earnings_module_1 = require("./modules/earnings/earnings.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const support_module_1 = require("./modules/support/support.module");
const account_module_1 = require("./modules/account/account.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const training_module_1 = require("./modules/training/training.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            profile_module_1.ProfileModule,
            kyc_module_1.KycModule,
            availability_module_1.AvailabilityModule,
            requests_module_1.RequestsModule,
            sessions_module_1.SessionsModule,
            safety_module_1.SafetyModule,
            earnings_module_1.EarningsModule,
            reviews_module_1.ReviewsModule,
            support_module_1.SupportModule,
            account_module_1.AccountModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
            training_module_1.TrainingModule,
            uploads_module_1.UploadsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map