import { SupportService } from './support.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getTickets(c: JwtPayload): Promise<{
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
    getTicket(c: JwtPayload, id: string): Promise<{
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
    createTicket(c: JwtPayload, dto: any): Promise<{
        ticketId: string;
        message: string;
    }>;
    getChatHistory(c: JwtPayload, id: string): Promise<{
        ticketId: string;
        messages: {
            id: string;
            from: string;
            text: string;
            time: string;
        }[];
    }>;
    addTicketMessage(c: JwtPayload, id: string, dto: any): Promise<{
        message: string;
    }>;
    getDisputes(c: JwtPayload): Promise<{
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
    getDispute(c: JwtPayload, id: string): Promise<{
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
    getHelpArticle(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string[];
        category: string;
        updatedDate: string;
    }>;
}
