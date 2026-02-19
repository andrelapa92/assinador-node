import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { VerifyResponseDto } from './dto/verify-response.dto';

@Injectable()
export class VerifyService {
  verifySignature(cmsBuffer: Buffer): VerifyResponseDto {
    try {
      const der = forge.util.createBuffer(cmsBuffer.toString('binary'));
      const asn1 = forge.asn1.fromDer(der);
      
      const p7 = forge.pkcs7.messageFromAsn1(asn1) as forge.pkcs7.PkcsSignedData;

      const isValid = (p7 as any).verify(); 

      if (!isValid) {
        return { status: 'INVALIDO', error: 'A integridade do documento falhou ou a assinatura é inválida.' };
      }

      const cert = p7.certificates?.[0];
      if (!cert) {
        return { status: 'INVALIDO', error: 'Certificado não encontrado' };
      }

      const cn = cert.subject.getField('CN')?.value ?? 'Desconhecido';
      const signerInfo = (p7 as any).rawCapture?.signerInfos?.[0];

      let signingTime = '';
      if (signerInfo?.authenticatedAttributes) {
        const attr = signerInfo.authenticatedAttributes.find(
          (a: any) => a.type === forge.pki.oids.signingTime,
        );

        if (attr?.value?.[0]) {
          signingTime = new Date(attr.value[0]).toISOString();
        }
      }

      const content = p7.content;
      const hash = forge.md.sha512.create();
      
      if (!content) {
        throw new Error('Conteúdo assinado não encontrado');
      }

      // Convertendo para string binária se for um objeto Buffer do forge
      const dataToHash = typeof content === 'string' ? content : content.getBytes();
      hash.update(dataToHash);

      return {
        status: 'VALIDO',
        error: '',
        infos: {
          nomeSignatario: String(cn),
          dataAssinatura: signingTime,
          hashDocumento: hash.digest().toHex(),
          algoritmoHash: 'SHA-512',
        },
      };
    } catch (error: any) {
      return {
        status: 'INVALIDO',
        error: error?.message || 'Erro desconhecido',
      };
    }
  }
}