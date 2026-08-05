const fs = require('fs');

const dashPath = '/app/dist/src/modules/dashboard/dashboard.controller.js';
let code = fs.readFileSync(dashPath, 'utf8');

// Add getPerformanceInsights and getAnnouncements methods + decorators
const insertBefore = `exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),`;

const newMethods = `    getPerformanceInsights(c) {
        return this.dashboardService.getPerformanceInsights(c.sub);
    }
    getAnnouncements() {
        return this.dashboardService.getAnnouncements();
    }
`;

// Insert new methods after getDashboardData method
code = code.replace(
  `    getDashboardData(c) {
        return this.dashboardService.getDashboardData(c.sub);
    }
}`,
  `    getDashboardData(c) {
        return this.dashboardService.getDashboardData(c.sub);
    }
    getPerformanceInsights(c) {
        return this.dashboardService.getPerformanceInsights(c.sub);
    }
    getAnnouncements() {
        return this.dashboardService.getAnnouncements();
    }
}`
);

// Add route decorators for the new methods
const existingDecorator = `__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get home dashboard overview' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getDashboardData", null);`;

const newDecorators = `
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get companion performance insights' }),
    __param(0, (0, current_companion_decorator_1.CurrentCompanion)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPerformanceInsights", null);
__decorate([
    (0, common_1.Get)('announcements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get companion platform announcements' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getAnnouncements", null);`;

code = code.replace(existingDecorator, existingDecorator + newDecorators);

fs.writeFileSync(dashPath, code);

// Verify
const verify = fs.readFileSync(dashPath, 'utf8');
console.log('performance route:', verify.includes("'performance'") ? '✅' : '❌');
console.log('announcements route:', verify.includes("'announcements'") ? '✅' : '❌');
console.log('getPerformanceInsights method:', verify.includes('getPerformanceInsights') ? '✅' : '❌');
console.log('getAnnouncements method:', verify.includes('getAnnouncements') ? '✅' : '❌');
console.log('Dashboard patch done!');
