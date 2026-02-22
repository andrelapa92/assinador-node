import { Test, TestingModule } from '@nestjs/testing';
import { CmsSignService } from './cms-sign.service';
import * as fs from 'fs';
import * as path from 'path';

describe('CmsSignService (Etapa 2)', () => {
  let service: CmsSignService;
  const p12Path = path.resolve(__dirname, '../../resources/cert/pkcs12/certificado_teste_hub.pfx');
  const p12Buffer = fs.readFileSync(p12Path);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CmsSignService],
    }).compile();
    service = module.get<CmsSignService>(CmsSignService);
  });

  it('deve gerar um container PKCS#7 (Buffer) ao assinar com senha correta', () => {
    const result = service.sign({
      fileBuffer: Buffer.from('texto'),
      pkcs12Buffer: p12Buffer,
      password: 'bry123456',
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('deve lançar erro ao usar senha incorreta', () => {
    expect(() => {
      service.sign({
        fileBuffer: Buffer.from('texto'),
        pkcs12Buffer: p12Buffer,
        password: 'senha_errada',
      });
    }).toThrow();
  });
});