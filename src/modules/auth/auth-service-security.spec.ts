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
    process.env.OTP_TEST_ALLOWED_PHONES