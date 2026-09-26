import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('getHealth', () => {
    it('should return health status ok when DB is connected', async () => {
      const res = await appController.getHealth();
      expect(res.status).toBe('ok');
      expect(res.database).toBe('connected');
    });
  });
});
