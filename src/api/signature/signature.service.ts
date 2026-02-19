import { Injectable } from '@nestjs/common';
import { CmsSignService } from '../../crypto/cms-sign.service';
import { SignResponseDto } from './dto/sign-response.dto';

@Injectable()
export class SignatureService {
  constructor(
    private readonly cmsSignService: CmsSignService,
  ) {}

  async signDocument(
    document: Buffer,
    pkcs12: Buffer,
    password: string,
  ): Promise<SignResponseDto> {
    const signatureBuffer = this.cmsSignService.sign({
      fileBuffer: document,
      pkcs12Buffer: pkcs12,
      password: password,
    });

    return { signature: signatureBuffer.toString('base64') };
  }

}
