"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const { method, url, body, query, ip } = req;
        const now = Date.now();
        const sanitize = (obj) => {
            if (!obj || typeof obj !== 'object')
                return obj;
            const copy = { ...obj };
            ['password', 'pass', 'pin', 'token', 'secret'].forEach(key => {
                if (key in copy)
                    copy[key] = '***MASKED***';
            });
            return copy;
        };
        const sanitizedBody = sanitize(body);
        const bodyStr = Object.keys(sanitizedBody || {}).length ? ` | Body: ${JSON.stringify(sanitizedBody)}` : '';
        const queryStr = Object.keys(query || {}).length ? ` | Query: ${JSON.stringify(query)}` : '';
        this.logger.log(`➡️  [REQ] ${method} ${url} (IP: ${ip || 'local'})${queryStr}${bodyStr}`);
        return next.handle().pipe((0, operators_1.tap)(data => {
            const duration = Date.now() - now;
            const statusCode = res.statusCode || 200;
            let respStr = '';
            if (data) {
                try {
                    const raw = typeof data === 'string' ? data : JSON.stringify(data);
                    respStr = ` | Res: ${raw.length > 300 ? raw.substring(0, 300) + '...[truncated]' : raw}`;
                }
                catch {
                    respStr = ' | Res: [Unserializable Payload]';
                }
            }
            this.logger.log(`⬅️  [RES] ${method} ${url} ${statusCode} — ${duration}ms${respStr}`);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map