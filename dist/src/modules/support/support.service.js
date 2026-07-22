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
            where: { companionId, category: { not: 'DISPUTE' } },
            orderBy: { createdAt: 'desc' },
            include: { messages: true },
        });
        const formattedTickets = tickets.map((t) => ({
            id: t.id,
            category: t.category,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status === 'OPEN' ? 'Open' : 'Closed',
            date: t.createdAt.toLocaleDateString(),
            messages: t.messages.map((m) => ({
                id: m.id,
                from: m.sender === 'agent' ? 'agent' : 'me',
                text: m.text,
                time: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })),
        }));
        return { tickets: formattedTickets };
    }
    async getTicket(companionId, ticketId) {
        const t = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, companionId },
            include: { messages: true },
        });
        if (!t)
            throw new common_1.NotFoundException('Ticket not found');
        return {
            id: t.id,
            category: t.category,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status === 'OPEN' ? 'Open' : 'Closed',
            date: t.createdAt.toLocaleDateString(),
            messages: t.messages.map((m) => ({
                id: m.id,
                from: m.sender === 'agent' ? 'agent' : 'me',
                text: m.text,
                time: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })),
        };
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
        await this.prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                sender: 'me',
                text: message,
            },
        });
        return { message: 'Reply sent' };
    }
    async getDisputes(companionId) {
        const disputes = await this.prisma.supportTicket.findMany({
            where: { companionId, category: 'DISPUTE' },
            orderBy: { createdAt: 'desc' },
            include: { timeline: true },
        });
        const formattedDisputes = disputes.map((d) => ({
            id: d.id,
            category: d.subject,
            description: d.description,
            sessionId: d.sessionId || '',
            customerName: d.customerName || 'Unknown',
            amount: d.amount || '0',
            status: d.status === 'RESOLVED' ? 'Resolved' : 'Under Review',
            outcome: d.outcome,
            createdAgo: d.createdAt.toLocaleDateString(),
            timeline: d.timeline.map((t) => ({
                date: t.date,
                desc: t.desc,
            })),
        }));
        return { disputes: formattedDisputes };
    }
    async getDispute(companionId, disputeId) {
        const d = await this.prisma.supportTicket.findFirst({
            where: { id: disputeId, companionId, category: 'DISPUTE' },
            include: { timeline: true },
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
        return {
            id: d.id,
            category: d.subject,
            description: d.description,
            sessionId: d.sessionId || '',
            customerName: d.customerName || 'Unknown',
            amount: d.amount || '0',
            status: d.status === 'RESOLVED' ? 'Resolved' : 'Under Review',
            outcome: d.outcome,
            createdAgo: d.createdAt.toLocaleDateString(),
            timeline: d.timeline.map((t) => ({
                date: t.date,
                desc: t.desc,
            })),
        };
    }
    async createDispute(companionId, dto) {
        const dispute = await this.prisma.supportTicket.create({
            data: {
                companionId,
                sessionId: dto.sessionId,
                subject: dto.category || `Dispute for Session ${dto.sessionId}`,
                description: dto.description,
                category: 'DISPUTE',
                priority: 'HIGH',
                status: 'UNDER REVIEW',
                timeline: {
                    create: {
                        date: new Date().toLocaleDateString(),
                        desc: 'Dispute filed by companion',
                    }
                }
            },
        });
        return { disputeId: dispute.id, message: 'Dispute submitted and under review.' };
    }
    async uploadDisputeEvidence(companionId, disputeId, evidenceUrls) {
        return { message: 'Evidence uploaded successfully' };
    }
    async getHelpArticles() {
        const articles = await this.prisma.helpArticle.findMany();
        return { articles };
    }
    async getHelpArticle(articleId) {
        const article = await this.prisma.helpArticle.findUnique({
            where: { id: articleId },
        });
        if (!article)
            throw new common_1.NotFoundException('Help Article not found');
        return article;
    }
    async getChatHistory(companionId, ticketId) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, companionId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return {
            ticketId,
            messages: ticket.messages.map((m) => ({
                id: m.id,
                from: m.sender === 'agent' ? 'agent' : 'me',
                text: m.text,
                time: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })),
        };
    }
    async appealDispute(companionId, disputeId, dto) {
        const dispute = await this.prisma.supportTicket.findFirst({
            where: { id: disputeId, companionId, category: 'DISPUTE' },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        await this.prisma.supportTicket.update({
            where: { id: disputeId },
            data: {
                description: dispute.description + '\n\n[APPEAL]: ' + dto.reason,
                status: 'UNDER REVIEW',
                timeline: {
                    create: {
                        date: new Date().toLocaleDateString(),
                        desc: 'Appeal submitted by companion',
                    }
                }
            },
        });
        return { success: true, message: 'Dispute appeal submitted successfully.' };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map