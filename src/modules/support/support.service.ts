import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(companionId: string) {
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

  async getTicket(companionId: string, ticketId: string) {
    const t = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, companionId },
      include: { messages: true },
    });
    if (!t) throw new NotFoundException('Ticket not found');
    
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
    
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        sender: 'me',
        text: message,
      },
    });
    return { message: 'Reply sent' };
  }

  async getDisputes(companionId: string) {
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

  async getDispute(companionId: string, disputeId: string) {
    const d = await this.prisma.supportTicket.findFirst({
      where: { id: disputeId, companionId, category: 'DISPUTE' },
      include: { timeline: true },
    });
    if (!d) throw new NotFoundException('Dispute not found');
    
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

  async createDispute(companionId: string, dto: any) {
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

  async uploadDisputeEvidence(companionId: string, disputeId: string, evidenceUrls: string[]) {
    // In actual implementation, we'd save to a separate evidence table or array column
    return { message: 'Evidence uploaded successfully' };
  }

  async getHelpArticles() {
    const articles = await this.prisma.helpArticle.findMany();
    // In this basic version we just return them all flat, the frontend filters or searches them
    return { articles };
  }

  async getHelpArticle(articleId: string) {
    const article = await this.prisma.helpArticle.findUnique({
      where: { id: articleId },
    });
    if (!article) throw new NotFoundException('Help Article not found');
    return article;
  }
  
  async getChatHistory(companionId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, companionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    
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

  async appealDispute(companionId: string, disputeId: string, dto: { reason: string; evidenceUrls?: string[] }) {
    const dispute = await this.prisma.supportTicket.findFirst({
      where: { id: disputeId, companionId, category: 'DISPUTE' },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

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
}

