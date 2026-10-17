import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QA_TEST_OTP, RETIRED_QA_TEST_OTP } from '../../common/utils/otp-test.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('Companion AuthService OTP delivery and QA authorization', () => {
  const originalEnv = process.env;
  const testPhone = '+919876543210';
  const makePrisma = () => ({
    oTPSession: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    companion: { findUnique: jest.fn().mockResolvedValue({ id: 'qa-companion', phone: testPhone, termsAccepted: false }) },
    companionPIN: { findUnique: jest.fn().mockResolvedValue(null) },
    refreshToken: { create: jest.fn().mockResolvedValue({}) },
  });
  let prisma: ReturnType<typeof makePrisma>;
  let service: AuthService;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test', OTP_TEST_BYPASS_ENABLED: 'false' };
    delete process.env.OTP_TEST_ALLOWED_PHONES;
    prisma = makePrisma();
    const config = { get: (key: string) => key === 'OTP_EXPIRES_IN_MINUTES' ? '10' : undefined };
    service = new AuthService(
      prisma as unknown as PrismaService,
      { sign: jest.fn().mockReturnValue('local-test-token') } as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  afterAll(() => { process.env = originalEnv; });

  const enableQa = () => {
    process.env.OTP_TEST_BYPASS_ENABLED = 'true';
    process.env.OTP_TEST_ALLOWED_PHONES = testPhone;
  };

  const storeChallenge = async (otp: string) => {
    const challenge = {
      id: 'qa-challenge', phone: testPhone, otp: await bcrypt.hash(otp, 10),
      expiresAt: new Date(Date.now() + 60_000), attempts: 0, verified: false,
    };
    prisma.oTPSession.findFirst.mockResolvedValue(challenge);
    return challenge;
  };

  it('returns 503 without persisting an OTP when no SMS sender is integrated', async () => {
    await expect(service.sendOtp({ phone: testPhone })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.oTPSession.deleteMany).not.toHaveBeenCalled();
    expect(prisma.oTPSession.create).not.toHaveBeenCalled();
  });

  it('stores a hashed six-digit QA challenge that the mobile form can submit', async () => {
    enableQa();
    const response = await service.sendOtp({ phone: testPhone });
    expect(response.message).toBe('QA test OTP prepared; no SMS was sent.');
    expect(response).not.toHaveProperty('otp');
    expect(response).not.toHaveProperty('devOtp');
    expect(/^\d{6}$/.test(QA_TEST_OTP)).toBe(true);
    const record = prisma.oTPSession.create.mock.calls[0][0].data;
    expect(record.otp === QA_TEST_OTP).toBe(false);
    await expect(bcrypt.compare(QA_TEST_OTP, record.otp)).resolves.toBe(true);
    prisma.oTPSession.findFirst.mockResolvedValue({ ...record, id: 'qa-challenge', attempts: 0, verified: false });
    await expect(service.verifyOtp({ phone: testPhone, otp: QA_TEST_OTP })).resolves.toMatchObject({ isNewCompanion: false });
    expect(prisma.oTPSession.update).toHaveBeenCalledWith({ where: { id: 'qa-challenge' }, data: { verified: true } });
  });

  it.each([
    ['disabled flag', { OTP_TEST_BYPASS_ENABLED: 'false' }],
    ['removed phone', { OTP_TEST_ALLOWED_PHONES: '+919000000001' }],
    ['production', { NODE_ENV: 'production' }],
  ])('rejects a stored QA hash after authorization changes: %s', async (_label, override) => {
    enableQa();
    await storeChallenge(QA_TEST_OTP);
    process.env = { ...process.env, ...override };
    await expect(service.verifyOtp({ phone: testPhone, otp: QA_TEST_OTP })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.oTPSession.update).toHaveBeenCalledWith({ where: { id: 'qa-challenge' }, data: { attempts: { increment: 1 } } });
    expect(prisma.companion.findUnique).not.toHaveBeenCalled();
  });

  it('rejects the retired eight-digit QA code even when its stored hash matches', async () => {
    enableQa();
    await storeChallenge(RETIRED_QA_TEST_OTP);
    await expect(service.verifyOtp({ phone: testPhone, otp: RETIRED_QA_TEST_OTP })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.companion.findUnique).not.toHaveBeenCalled();
  });

  it('preserves normal stored OTP verification with QA disabled', async () => {
    const normalOtp = '9'.repeat(6);
    await storeChallenge(normalOtp);
    await expect(service.verifyOtp({ phone: testPhone, otp: normalOtp })).resolves.toMatchObject({ isNewCompanion: false });
    expect(prisma.oTPSession.update).toHaveBeenCalledWith({ where: { id: 'qa-challenge' }, data: { verified: true } });
  });

  it.each(['production', 'unlisted'] as const)('never issues QA challenges for %s requests', async (reason) => {
    enableQa();
    if (reason === 'production') process.env.NODE_ENV = 'production';
    else process.env.OTP_TEST_ALLOWED_PHONES = '+919000000001';
    await expect(service.sendOtp({ phone: testPhone })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.oTPSession.create).not.toHaveBeenCalled();
  });

  it.each(['missing', 'expired', 'locked'] as const)('requires a valid challenge before QA verification: %s', async (state) => {
    enableQa();
    const challenge = await storeChallenge(QA_TEST_OTP);
    if (state === 'missing') prisma.oTPSession.findFirst.mockResolvedValue(null);
    if (state === 'expired') challenge.expiresAt = new Date(0);
    if (state === 'locked') challenge.attempts = 100;
    await expect(service.verifyOtp({ phone: testPhone, otp: QA_TEST_OTP })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.companion.findUnique).not.toHaveBeenCalled();
  });
});
