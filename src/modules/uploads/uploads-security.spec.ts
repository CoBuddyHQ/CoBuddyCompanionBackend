import { UploadsService } from './uploads.service';
describe('private upload boundary', () => {
  it('rejects access when the requesting owner has no matching upload', async () => {
    const prisma = { uploadedFile: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new UploadsService(prisma as any, { get: () => undefined } as any);
    await expect(service.streamPrivateFile('other', 'file', {} as any)).rejects.toThrow('Document not found');
    expect(prisma.uploadedFile.findFirst).toHaveBeenCalledWith({ where: { id: 'file', companionId: 'other' } });
  });
  it('blocks production private uploads until protected storage is implemented', async () => {
    const service = new UploadsService({} as any, { get: (name: string) => name === 'NODE_ENV' ? 'production' : undefined } as any);
    const file = { originalname: 'test.png', mimetype: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') } as Express.Multer.File;
    await expect(service.uploadFile('owner', file, 'kyc_identity')).rejects.toThrow('Private document storage');
  });
});
