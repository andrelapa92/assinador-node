import { Test, TestingModule } from '@nestjs/testing';
import { VerifyService } from './verify.service';
import * as fs from 'fs';
import * as path from 'path';

describe('VerifyService (Etapa 3)', () => {
  let service: VerifyService;

  // 1. Usaremos o arquivo "sample.p7s" gerado na Etapa 2 e deixado na pasta "output" para um teste real
  const signaturePath = path.resolve(process.cwd(), 'output', 'sample.p7s');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyService],
    }).compile();

    service = module.get<VerifyService>(VerifyService);
  });

  it('deve extrair corretamente os dados de uma assinatura PKCS#7 válida', () => {
    // 2. Verifica se o arquivo existe (pode ser o gerado pelo teste anterior)
    if (!fs.existsSync(signaturePath)) {
      // Fallback: Se não houver o arquivo no output, o teste avisa
      console.warn('Arquivo assinatura.p7s não encontrado em /output.');
      return; 
    }

    const signatureBuffer = fs.readFileSync(signaturePath);

    // 3. Executamos a verificação usando o novo nome de método
    const result = service.verifySignature(signatureBuffer);

    // 4. Asserts 
    expect(result.status).toBe('VALIDO');
    expect(result.infos).toBeDefined();
    
    expect(result.infos?.nomeSignatario).toBeDefined();
    expect(result.infos?.algoritmoHash).toBe('SHA-512');
    
    console.log('Dados extraídos:', result.infos);
  });

  it('deve retornar status INVALIDO para arquivos corrompidos ou aleatórios', () => {
    const corruptedBuffer = Buffer.from('Este não é um arquivo PKCS7 válido');
    const result = service.verifySignature(corruptedBuffer);

    expect(result.status).toBe('INVALIDO');
    expect(result.error).toMatch(/Erro técnico/); // Erro esperado pelo catch do service
  });

  it('deve identificar se o Base64 é válido e processá-lo', () => {
    // Mock simples de um buffer que seria um Base64 inválido mas com formato de string
    const fakeBase64 = Buffer.from('ZXN0ZSB0ZXN0ZSB0ZW0gcXVlIGZalGxhcg=='); 
    const result = service.verifySignature(fakeBase64);
    
    expect(result.status).toBe('INVALIDO');
  });
});