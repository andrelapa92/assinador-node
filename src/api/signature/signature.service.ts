import { Injectable } from '@nestjs/common';
import { CmsSignService } from '../../crypto/cms-sign.service';
import { SignResponseDto } from './dto/sign-response.dto';
import * as fs from 'fs';
import * as path from 'path';

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
    // Gera a assinatura
    const signatureBuffer = this.cmsSignService.sign({
      fileBuffer: document,
      pkcs12Buffer: pkcs12,
      password: password,
    });

    // Define o caminho onde a assinatura será gravada
    const outputPath = path.resolve(process.cwd(), 'resources', 'arquivos', 'assinatura.p7s');

    try {
      // Grava a assinatura em disco (binário)
      fs.writeFileSync(outputPath, signatureBuffer);
      console.log(`Assinatura gravada com sucesso em: ${outputPath}`);
    } catch (error) {
      console.error('Erro ao gravar arquivo .p7s em disco:', error);
      
    }
    
    return { signature: signatureBuffer.toString('base64') };
  }

}
