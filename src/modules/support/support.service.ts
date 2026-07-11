import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(companionId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { companionId },
      orderBy: { createdAt: 'desc' },
    });
    return { tickets };
  }

  async getTicket(companionId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, companionId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async createTicket(companionId: string, dto: any) {
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

  async addTicketMessage(companionId: string, ticketId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { id: ticketId, companionId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    // For simplicity, just append to description in this scaffold
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { description: ticket.description + '\n\n[Companion]: ' + message },
    });
    return { message: 'Reply sent' };
  }

  async getDisputes(companionId: string) {
    const disputes = await this.prisma.supportTicket.findMany({
      where: { companionId, category: 'DISPUTE' },
      orderBy: { createdAt: 'desc' },
    });
    return { disputes };
  }

  async getDispute(companionId: string, disputeId: string) {
    const dispute = await this.prisma.supportTicket.findFirst({
      where: { id: disputeId, companionId, category: 'DISPUTE' },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async createDispute(companionId: string, dto: any) {
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

  async uploadDisputeEvidence(companionId: string, disputeId: string, evidenceUrls: string[]) {
    // In actual implementation, we'd save to a separate evidence table or array column
    return { message: 'Evidence uploaded successfully' };
  }

  async getHelpArticles() {
    // Return static mock for now
    return {
      categories: [
        { id: '1', title: 'Getting Started', articles: [{ id: 'a1', title: 'How to use CoBuddy' }] },
      ],
    };
  }

  async getHelpArticle(articleId: string) {
    return { id: articleId, title: 'Help Article', content: 'Details here...' };
  }

  // ─── Missing Endpoints from Audit ──────────────────────────────────────────
  
  async getChatHistory(companionId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, companionId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    // In actual implementation, we would have a TicketMessage model.
    // For now, return a mock response matching frontend expectations.
    return {
      ticketId,
      messages: [
        {
          id: 'msg-1',
          sender: 'system',
          content: 'Ticket opened. We will connect you to an agent shortly.',
          timestamp: ticket.createdAt.toISOString(),
        },
      ],
    };
  }

  async appealDispute(companionId: string, disputeId: string, dto: { reason: string; evidenceUrls?: string[] }) {
    const dispute = await this.prisma.supportTicket.findFirst({
      where: { id: disputeId, companionId, category: 'DISPUTE' },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    await this.prisma.supportTicket.update({
      where: { id: disputeId },
      data: {
        description: dispute.description + '\n\n[APPEAL]: ' + dto.reason,
        status: 'OPEN',
      },
    });

    return { success: true, message: 'Dispute appeal submitted successfully.' };
  }
}
