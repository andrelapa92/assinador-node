import { Injectable, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { SignResponseDto } from './dto/sign-response.dto';

@Injectable()
export class SignatureService {
  // Alias solicitado no desafio
  private readonly TARGET_ALIAS = 'e2618a8b-20de-4dd2-b209-70912e3177f4';

  async signDocument(
    document: Buffer,
    pkcs12: Buffer,
    password: string,
  ): Promise<SignResponseDto> {
    try {
      // 1. Gera a assinatura digital (Lógica que estava no CmsSignService)
      const signatureBuffer = this.generateCmsSignature(document, pkcs12, password);

      // 2. Define o caminho de saída (Volume do Docker)
      const outputPath = path.resolve(process.cwd(), 'output', 'assinatura.p7s');

      // 3. Grava em disco de forma síncrona para garantir a integridade antes da resposta
      this.saveSignatureToDisk(outputPath, signatureBuffer);

      // 4. Retorna o Base64 conforme o DTO
      return { 
        signature: signatureBuffer.toString('base64') 
      };
    } catch (error) {
      throw new BadRequestException(`Falha no processo de assinatura: ${error.message}`);
    }
  }

  /**
   * Encapsula a lógica complexa do Node-Forge (Antigo CmsSignService)
   */
  private generateCmsSignature(fileBuffer: Buffer, pkcs12Buffer: Buffer, password: string): Buffer {
    const p12Der = forge.util.createBuffer(pkcs12Buffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] || 
                    p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];

    const certBag = certBags?.find(bag => bag.attributes.friendlyName?.[0] === this.TARGET_ALIAS) || certBags?.[0];
    const keyBag = keyBags?.find(bag => bag.attributes.friendlyName?.[0] === this.TARGET_ALIAS) || keyBags?.[0];

    if (!certBag || !keyBag) {
      throw new Error(`Certificado ou chave não encontrados para o alias: ${this.TARGET_ALIAS}`);
    }

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
    p7.addCertificate(certBag.cert as forge.pki.Certificate);
    
    p7.addSigner({
      key: keyBag.key as any,
      certificate: certBag.cert as forge.pki.Certificate,
      digestAlgorithm: forge.pki.oids.sha512,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date () as any },
      ],
    });

    p7.sign({ detached: false });
    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return Buffer.from(der, 'binary');
  }

  private saveSignatureToDisk(outputPath: string, buffer: Buffer): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
  }
}