import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class CryptoService {
  abstract generateHash(buffer: Buffer): string;

  abstract sign(params: {
    fileBuffer: Buffer;
    pkcs12Buffer: Buffer;
    password: string;
  }): Buffer;

  abstract verify(signatureBuffer: Buffer): {
    valid: boolean;
    infos?: {
      signerName: string;
      signingTime: Date;
      hash: string;
      algorithm: string;
    };
  };
}
