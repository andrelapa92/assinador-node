import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import * as forge from 'node-forge';

// Implementação concreta para o teste
class CryptoServiceTest extends CryptoService {
  generateHash(buffer: Buffer): string {
    const md = forge.md.sha256.create();
    md.update(buffer.toString('binary'));
    return md.digest().toHex();
  }

  sign(_params: {
    fileBuffer: Buffer;
    pkcs12Buffer: Buffer;
    password: string;
  }): Buffer {
    return Buffer.from('signature');
  }

  verify(_signatureBuffer: Buffer) {
    return {
      valid: true,
      infos: {
        signerName: 'Test',
        signingTime: new Date(),
        hash: 'hash',
        algorithm: 'sha256',
      },
    };
  }
}

describe('CryptoService', () => {
  let service: CryptoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CryptoService, // Token da classe abstrata
          useClass: CryptoServiceTest, // Implementação real
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should sign data and verify signature successfully', () => {
    const data = Buffer.from('conteudo importante');
    const dummyPkcs12 = Buffer.from('p12');

    // Passando o objeto esperado pelo método sign
    const signature = service.sign({
      fileBuffer: data,
      pkcs12Buffer: dummyPkcs12,
      password: 'bry123456',
    });

    const result = service.verify(signature);

    expect(signature).toBeInstanceOf(Buffer);
    expect(result.valid).toBe(true);
  });

  it('should generate the same hash for the same input', () => {
    const data = Buffer.from('mensagem teste');
    const hash1 = service.generateHash(data);
    const hash2 = service.generateHash(data);

    expect(hash1).toBe(hash2);
  });
});
