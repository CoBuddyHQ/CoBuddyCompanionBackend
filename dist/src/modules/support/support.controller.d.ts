import { SupportService } from './support.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getTickets(c: JwtPayload): Promise<{
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
    getTicket(c: JwtPayload, id: string): Promise<{
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
    createTicket(c: JwtPayload, dto: any): Promise<{
        ticketId: string;
        message: string;
    }>;
    addTicketMessage(c: JwtPayload, id: string, dto: any): Promise<{
        message: string;
    }>;
    getDisputes(c: JwtPayload): Promise<{
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
    getDispute(c: JwtPayload, id: string): Promise<{
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
    createDispute(c: JwtPayload, dto: any): Promise<{
        disputeId: string;
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
