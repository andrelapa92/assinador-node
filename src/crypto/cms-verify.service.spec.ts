import { Test, TestingModule } from '@nestjs/testing';
import { CmsVerifyService } from './cms-verify.service';
import * as fs from 'fs';
import * as path from 'path';

describe('CmsVerifyService (Etapa 3)', () => {
  let service: CmsVerifyService;

  // Caminho para o arquivo mockado
  const fixturePath = path.resolve(__dirname, './fixtures/sample.p7s');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CmsVerifyService],
    }).compile();

    service = module.get<CmsVerifyService>(CmsVerifyService);
  });

  it('deve extrair corretamente os dados do arquivo .p7s mockado', () => {
    // 1. Lemos o arquivo mockado
    if (!fs.existsSync(fixturePath)) {
      throw new Error('Arquivo de fixture não encontrado. Verifique o caminho.');
    }
    const signatureBuffer = fs.readFileSync(fixturePath);

    // 2. Executamos a verificação
    const result = service.verify(signatureBuffer);

    // 3. Asserts baseados no que sabemos que existe no mock
    expect(result.status).toBe('VALIDO');
    expect(result.infos).toBeDefined();
    expect(result.infos?.nomeSignatario).toContain('HUB2 TESTES');
    expect(result.infos?.algoritmoHash).toBe('SHA-512');
  });

  it('deve falhar ao tentar verificar um arquivo corrompido', () => {
    const corruptedBuffer = Buffer.from('Arquivo fake');
    const result = service.verify(corruptedBuffer);

    expect(result.status).toBe('INVALIDO');
    expect(result.error).toBeDefined();
  });
});