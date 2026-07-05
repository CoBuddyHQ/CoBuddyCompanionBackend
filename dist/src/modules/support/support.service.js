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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SupportService = class SupportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTickets(companionId) {
        const tickets = await this.prisma.supportTicket.findMany({
            where: { companionId },
            orderBy: { createdAt: 'desc' },
        });
        return { tickets };
    }
    async getTicket(companionId, ticketId) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, companionId },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return ticket;
    }
    async createTicket(companionId, dto) {
        const ticket = await this.prisma.supportTicket.create({
            data: {
                companionId,
                subject: dto.subject,
                description: dto.description,
                category: dto.category,
                priority: dto.priority || 'NORMAL',
                status: 'OPEN',
            },
        });
        return { ticketId: ticket.id, message: 'Support ticket created successfully.' };
    }
    async addTicketMessage(companionId, ticketId, message) {
        const ticket = await this.prisma.supportTicket.findFirst({ where: { id: ticketId, companionId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { description: ticket.description + '\n\n[Companion]: ' + message },
        });
        return { message: 'Reply sent' };
    }
    async getDisputes(companionId) {
        const disputes = await this.prisma.supportTicket.findMany({
            where: { companionId, category: 'DISPUTE' },
            orderBy: { createdAt: 'desc' },
        });
        return { disputes };
    }
    async getDispute(companionId, disputeId) {
        const dispute = await this.prisma.supportTicket.findFirst({
            where: { id: disputeId, companionId, category: 'DISPUTE' },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        return dispute;
    }
    async createDispute(companionId, dto) {
        const dispute = await this.prisma.supportTicket.create({
            data: {
                companionId,
                sessionId: dto.sessionId,
                subject: `Dispute for Session ${dto.sessionId}`,
                description: dto.reason,
                category: 'DISPUTE',
                priority: 'HIGH',
                status: 'OPEN',
            },
        });
        return { disputeId: dispute.id, message: 'Dispute submitted and under review.' };
    }
    async uploadDisputeEvidence(companionId, disputeId, evidenceUrls) {
        return { message: 'Evidence uploaded successfully' };
    }
    async getHelpArticles() {
        return {
            categories: [
                { id: '1', title: 'Getting Started', articles: [{ id: 'a1', title: 'How to use CoBuddy' }] },
            ],
        };
    }
    async getHelpArticle(articleId) {
        return { id: articleId, title: 'Help Article', content: 'Details here...' };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map