import { SupportService } from './support.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getTickets(c: JwtPayload): Promise<{
        tickets: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            description: string;
            category: string;
            status: string;
            sessionId: string | null;
            subject: string;
            priority: string;
        }[];
    }>;
    getTicket(c: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companionId: string;
        description: string;
        category: string;
        status: string;
        sessionId: string | null;
        subject: string;
        priority: string;
    }>;
    createTicket(c: JwtPayload, dto: any): Promise<{
        ticketId: string;
        message: string;
    }>;
    getChatHistory(c: JwtPayload, id: string): Promise<{
        ticketId: string;
        messages: {
            id: string;
            sender: string;
            content: string;
            timestamp: string;
        }[];
    }>;
    addTicketMessage(c: JwtPayload, id: string, dto: any): Promise<{
        message: string;
    }>;
    getDisputes(c: JwtPayload): Promise<{
        disputes: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companionId: string;
            description: string;
            category: string;
            status: string;
            sessionId: string | null;
            subject: string;
            priority: string;
        }[];
    }>;
    getDispute(c: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companionId: string;
        description: string;
        category: string;
        status: string;
        sessionId: string | null;
        subject: string;
        priority: string;
    }>;
    createDispute(c: JwtPayload, dto: any): Promise<{
        disputeId: string;
        message: string;
    }>;
    appealDispute(c: JwtPayload, id: string, dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadDisputeEvidence(c: JwtPayload, id: string, dto: any): Promise<{
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
    getHelpArticle(id: string): Promise<{
        id: string;
        title: string;
        content: string;
    }>;
}
