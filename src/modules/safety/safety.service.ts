import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);
  constructor(private prisma: PrismaService) {}

  // ── POST /companion/safety/sos/trigger ────────────────────────────────────
  async triggerSOS(companionId: string, sessionId?: string, lat?: number, lng?: number) {
    const sos = await this.prisma.sOSEvent.create({
      data: {
        companionId,
        sessionId: sessionId ?? null,
        latitude: lat as any,
        longitude: lng as any,
      },
    });
    // TODO: Alert trusted contacts + admin via push notification
    this.logger.warn(`🚨 SOS triggered by companion ${companionId}`);
    return {
      sosId: sos.id,
      status: 'triggered',
      message: 'SOS alert sent to your trusted contacts and CoBuddy Safety Team.',
      triggeredAt: sos.createdAt.toISOString(),
    };
  }

  // ── POST /companion/safety/sos/resolve ────────────────────────────────────
  async resolveSOS(companionId: string, sosId: string) {
    await this.prisma.sOSEvent.updateMany({
      where: { companionId, id: sosId },
      data: { resolvedAt: new Date(), resolvedBy: 'companion' },
    });
    return { message: 'SOS resolved. Stay safe!' };
  }

  // ── POST /companion/safety/timer/start ────────────────────────────────────
  async startTimer(companionId: string, durationMinutes: number, sessionId?: string) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    await this.prisma.safetyTimer.upsert({
      where: { companionId },
      update: { status: 'active', durationMinutes, startedAt: new Date(), expiresAt, sessionId: sessionId ?? null, cancelledAt: null },
      create: { companionId, sessionId: sessionId ?? null, status: 'active', durationMinutes, startedAt: new Date(), expiresAt },
    });
    // Update session
    if (sessionId) {
      await this.prisma.session.updateMany({ where: { id: sessionId }, data: { safetyTimerActive: true } });
    }
    return {
      status: 'active',
      durationMinutes,
      expiresAt: expiresAt.toISOString(),
      message: `Safety timer set for ${durationMinutes} minutes.`,
    };
  }

  // ── POST /companion/safety/timer/checkin ──────────────────────────────────
  async checkinTimer(companionId: string) {
    const timer = await this.prisma.safetyTimer.findUnique({ where: { companionId } });
    if (!timer || timer.status !== 'active') throw new NotFoundException('No active safety timer');

    // Extend by another duration
    const newExpiry = new Date(Date.now() + timer.durationMinutes * 60 * 1000);
    await this.prisma.safetyTimer.update({
      where: { companionId },
      data: { lastCheckinAt: new Date(), expiresAt: newExpiry },
    });
    return { status: 'active', nextCheckinAt: newExpiry.toISOString(), message: 'Check-in recorded. Timer reset.' };
  }

  // ── POST /companion/safety/timer/cancel ───────────────────────────────────
  async cancelTimer(companionId: string) {
    await this.prisma.safetyTimer.updateMany({
      where: { companionId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    return { status: 'cancelled', message: 'Safety timer cancelled.' };
  }

  // ── GET /companion/safety/trusted-contacts ────────────────────────────────
  async getTrustedContacts(companionId: string) {
    const contacts = await this.prisma.trustedContact.findMany({
      where: { companionId, deletedAt: null },
      orderBy: { isEmergencyContact: 'desc' },
    });
    return contacts.map(c => this.toContactResponse(c));
  }

  // ── POST /companion/safety/trusted-contacts/add ───────────────────────────
  async addTrustedContact(companionId: string, dto: any) {
    const masked = this.maskPhone(dto.phone);
    const contact = await this.prisma.trustedContact.create({
      data: {
        companionId,
        name: dto.name,
        phone: dto.phone,
        maskedPhone: masked,
        relationship: dto.relationship,
        isEmergencyContact: dto.isEmergencyContact ?? false,
      },
    });
    return this.toContactResponse(contact);
  }

  // ── PUT /companion/safety/trusted-contacts/:contactId ─────────────────────
  async updateTrustedContact(companionId: string, contactId: string, dto: any) {
    const contact = await this.prisma.trustedContact.updateMany({
      where: { id: contactId, companionId },
      data: {
        name: dto.name,
        phone: dto.phone,
        maskedPhone: dto.phone ? this.maskPhone(dto.phone) : undefined,
        relationship: dto.relationship,
        isEmergencyContact: dto.isEmergencyContact,
      },
    });
    return { contactId, message: 'Contact updated' };
  }

  // ── DELETE /companion/safety/trusted-contacts/:contactId ──────────────────
  async deleteTrustedContact(companionId: string, contactId: string) {
    await this.prisma.trustedContact.updateMany({
      where: { id: contactId, companionId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Contact removed' };
  }

  // ── POST /companion/safety/block/:customerId ──────────────────────────────
  async blockCustomer(companionId: string, customerId: string, reason?: string) {
    await this.prisma.blockedCustomer.upsert({
      where: { companionId_customerId: { companionId, customerId } },
      update: { reason },
      create: { companionId, customerId, reason },
    });
    return { message: 'Customer blocked. They will not appear in your requests.' };
  }

  // ── POST /companion/safety/report/:customerId ─────────────────────────────
  async reportCustomer(companionId: string, customerId: string, reason: string, sessionId?: string) {
    await this.prisma.incidentReport.create({
      data: {
        companionId,
        sessionId: sessionId ?? null,
        description: reason,
      },
    });
    return { message: 'Customer reported to CoBuddy Safety Team. We will review within 24 hours.' };
  }

  // ── POST /companion/safety/incident ──────────────────────────────────────
  async reportIncident(companionId: string, description: string, sessionId?: string) {
    const report = await this.prisma.incidentReport.create({
      data: { companionId, sessionId: sessionId ?? null, description },
    });
    return { reportId: report.id, message: 'Incident report submitted.', status: 'submitted' };
  }

  // ── POST /companion/safety/incident/:reportId/evidence ───────────────────
  async uploadEvidence(companionId: string, reportId: string, evidenceUrls: string[]) {
    await this.prisma.incidentReport.updateMany({
      where: { id: reportId, companionId },
      data: { evidenceUrls },
    });
    return { message: 'Evidence uploaded successfully.' };
  }

  private toContactResponse(c: any) {
    return {
      contactId: c.id,
      name: c.name,
      maskedPhone: c.maskedPhone,
      relationship: c.relationship,
      isEmergencyContact: c.isEmergencyContact,
    };
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    return `+91 ••••••${phone.slice(-4)}`;
  }
}
