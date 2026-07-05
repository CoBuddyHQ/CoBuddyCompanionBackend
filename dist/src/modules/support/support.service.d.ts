import { PrismaService } from '../../prisma/prisma.service';
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    getTickets(companionId: string): Promise<{
        tickets: {
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            category: string;
            status: string;
            sessionId: string | null;
            subject: string;
            priority: string;
        }[];
    }>;
    getTicket(companionId: string, ticketId: string): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companionId: string;
        category: string;
        status: string;
        sessionId: string | null;
        subject: string;
        priority: string;
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
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            category: string;
            status: string;
            sessionId: string | null;
            subject: string;
            priority: string;
        }[];
    }>;
    getDispute(companionId: string, disputeId: string): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companionId: string;
        category: string;
        status: string;
        sessionId: string | null;
        subject: string;
        priority: string;
    }>;
    createDispute(companionId: string, dto: any): Promise<{
        disputeId: string;
        message: string;
    }>;
    uploadDisputeEvidence(companionId: string, disputeId: string, evidenceUrls: string[]): Promise<{
        message: string;
    }>;
    getHelpArticles(): Promise<{
        categories: {
            id: string;
            title: string;
            articles: {
                id: string;
                title: string;
            }[];
        }[];
    }>;
    getHelpArticle(articleId: string): Promise<{
        id: string;
        title: string;
        content: string;
    }>;
}
