import { ProfileService } from './profile.service';

describe('profile approval boundary', () => {
  it('does not invent categories, languages or pricing for incomplete profiles', async () => {
    const prisma = { companion: { findUnique: jest.fn().mockResolvedValue({ categories: [], languages: [], hourlyRate: null }), update: jest.fn() } };
    await expect(new ProfileService(prisma as any, {} as any).submitForReview('test')).rejects.toThrow('Select categories');
    expect(prisma.companion.update).not.toHaveBeenCalled();
  });
  it('never approves submitted profiles when QA login is enabled', async () => {
    const previous = process.env.OTP_TEST_BYPASS_ENABLED;
    process.env.OTP_TEST_BYPASS_ENABLED = 'true';
    const prisma = {
      companion: {
        findUnique: jest.fn().mockResolvedValue({ categories: [{}], languages: [{}], hourlyRate: 500 }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
      companionKYC: { upsert: jest.fn().mockResolvedValue({}) },
    };
    try {
      const result = await new ProfileService(prisma as any, {} as any).submitForReview('test');
      expect(result.verificationStatus).toBe('pending_review');
      expect(prisma.companion.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verificationStatus: 'pending_review' }) }));
    } finally {
      if (previous === undefined) delete process.env.OTP_TEST_BYPASS_ENABLED;
      else process.env.OTP_TEST_BYPASS_ENABLED = previous;
    }
  });
});
