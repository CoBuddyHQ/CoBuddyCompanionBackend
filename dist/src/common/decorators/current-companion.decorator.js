"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentCompanion = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentCompanion = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const companion = request.user;
    return data ? companion?.[data] : companion;
});
//# sourceMappingURL=current-companion.decorator.js.map