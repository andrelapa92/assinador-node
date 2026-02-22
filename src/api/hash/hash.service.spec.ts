import { Test, TestingModule } from '@nestjs/testing';
import { HashService } from './hash.service';

describe('HashService (Etapa 1)', () => {
  let service: HashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
  });

  it('deve gerar um hash SHA-512 válido', () => {
    const mockFile = {
      buffer: Buffer.from('teste bry'),
      originalname: 'doc.txt',
    } as Express.Multer.File;

    const result = service.calculateFileHash(mockFile);

    expect(result.hash).toHaveLength(128);
    expect(result.file).toBe('doc.txt');
  });
});