import { Test, TestingModule } from '@nestjs/testing';
import { SignatureService } from './signature.service';
import * as fs from 'fs';
import * as path from 'path';

describe('SignatureService (Teste com Arquivos Reais)', () => {
  let service: SignatureService;

  const docPath = path.resolve(process.cwd(), 'resources', 'arquivos', 'doc.txt');
  const certPath = path.resolve(process.cwd(), 'resources', 'cert', 'pkcs12', 'certificado_teste_hub.pfx');
  const password = 'bry123456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignatureService],
    }).compile();

    service = module.get<SignatureService>(SignatureService);
  });

   const outputPath = path.resolve(process.cwd(), 'output', 'assinatura.p7s');

  afterAll(() => {
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`Limpeza: Arquivo temporário ${outputPath} removido.`);
      }
    } catch (error) {
      console.error('Erro ao limpar arquivo de teste:', error);
    }
  });

  it('deve assinar o arquivo doc.txt e gravar o arquivo assinatura.p7s em disco', async () => {
    // 1. Validação de pré-requisitos: verifica se os arquivos existem antes de testar
    if (!fs.existsSync(docPath)) {
      throw new Error(`Documento não encontrado em: ${docPath}`);
    }

    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificado não encontrado em: ${certPath}`);
    }

    // 2. Leitura dos buffers reais
    const docBuffer = fs.readFileSync(docPath);
    const p12Buffer = fs.readFileSync(certPath);

    // 3. Execução do serviço (Etapa 2)
    const result = await service.signDocument(docBuffer, p12Buffer, password);

    // 4. Asserts
    expect(result).toBeDefined();
    expect(result.signature).toBeDefined(); // Base64 da assinatura
    
    // Verifica se o arquivo .p7s foi realmente gravado pelo service
    const fileExists = fs.existsSync(outputPath);
    
    expect(fileExists).toBe(true);

    if (fileExists) {
      const stats = fs.statSync(outputPath);
      expect(stats.size).toBeGreaterThan(0);
      console.log(`Sucesso! Arquivo assinado gerado com ${stats.size} bytes.`);
    }
  }
);
});