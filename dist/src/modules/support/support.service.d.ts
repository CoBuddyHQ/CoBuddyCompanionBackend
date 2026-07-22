import { PrismaService } from '../../prisma/prisma.service';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    getTickets(companionId: string): Promise<{
        tickets: {
            id: string;
            category: string;
            subject: string;
            description: string;
            priority: string;
            status: string;
            date: string;
            messages: {
                id: string;
                from: string;
                text: string;
                time: string;
            }[];
        }[];
    }>;
    getTicket(companionId: string, ticketId: string): Promise<{
        id: string;
        category: string;
        subject: string;
        description: string;
        priority: string;
        status: string;
        date: string;
        messages: {
            id: string;
            from: string;
            text: string;
            time: string;
        }[];
    }>;
    createTicket(companionId: string, dto: any): Promise<{
        ticketId: string;
        message: string;
    }>;
    addTicketMessage(companionId: string, ticketId: string, message: string): Promise<{
        message: string;
    }>;
    getDisputes(companionId: string): Promise<{
        disputes: {
            id: string;
            category: string;
            description: string;
            sessionId: string;
            customerName: string;
            amount: string;
            status: string;
            outcome: string;
            createdAgo: string;
            timeline: {
                date: string;
                desc: string;
            }[];
        }[];
    }>;
    getDispute(companionId: string, disputeId: string): Promise<{
        id: string;
        category: string;
        description: string;
        sessionId: string;
        customerName: string;
        amount: string;
        status: string;
        outcome: string;
        createdAgo: string;
        timeline: {
            date: string;
            desc: string;
        }[];
    }>;
    createDispute(companionId: string, dto: any): Promise<{
        disputeId: string;
        message: string;
    }>;
    uploadDisputeEvidence(companionId: string, disputeId: string, evidenceUrls: string[]): Promise<{
        message: string;
    }>;
    getHelpArticles(): Promise<{
        articles: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            body: string[];
            category: string;
            updatedDate: string;
        }[];
    }>;
    getHelpArticle(articleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string[];
        category: string;
        updatedDate: string;
    }>;
    getChatHistory(companionId: string, ticketId: string): Promise<{
        ticketId: string;
        messages: {
            id: string;
            from: string;
            text: string;
            time: string;
        }[];
    }>;
    appealDispute(companionId: string, disputeId: string, dto: {
        reason: string;
        evidenceUrls?: string[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
