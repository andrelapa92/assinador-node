import { Injectable, Logger } from '@nestjs/common';
import * as forge from 'node-forge';
import { VerifyResponseDto } from './dto/verify-response.dto';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);

  /**
   * Ponto de entrada para verificar uma assinatura CMS (PKCS#7)
   */
  verifySignature(cmsBuffer: Buffer): VerifyResponseDto {
    try {
      // 1. Detecta o formato (Base64 ou Binário) e faz o Parse
      let rawContent: string;
      const bufferString = cmsBuffer.toString('utf8');
      const isBase64 = /^[A-Za-z0-9+/=]+\s*$/.test(bufferString.trim());
      
      rawContent = isBase64 ? forge.util.decode64(bufferString) : cmsBuffer.toString('binary');

      const der = forge.util.createBuffer(rawContent);
      const asn1 = forge.asn1.fromDer(der);
      const p7 = forge.pkcs7.messageFromAsn1(asn1);
      const p7Any = p7 as any;

      // 2. Busca o Signatário (Tentativa Automática e Fallback Manual)
      let signer = (p7Any.signers?.length > 0) ? p7Any.signers[0] : (p7Any.signerInfos?.length > 0 ? p7Any.signerInfos[0] : null);

      if (!signer) {
        signer = this.tryManualSignerExtraction(asn1);
      }

      if (!signer) {
        return { status: 'INVALIDO', error: 'SignerInfo não encontrado na assinatura.' };
      }

      // 3. Busca o Certificado
      const cert = p7Any.certificates?.[0];
      if (!cert) return { status: 'INVALIDO', error: 'Certificado não encontrado.' };

      // 4. Identificar Algoritmo de Hash (Suporta SHA-256 e SHA-512)
      const mdOid = forge.pki.oids[signer.digestAlgorithm] || signer.digestAlgorithm;
      const isSha256 = mdOid === forge.pki.oids.sha256;
      const algoName = isSha256 ? 'SHA-256' : 'SHA-512';

      // 5. Validar Integridade (Message Digest)
      const attrs = (signer.authenticatedAttributes || signer.authAttributes || []) as any[];
      const mdAttr = attrs.find((a: any) => 
        a.type === forge.pki.oids.messageDigest || forge.pki.oids[a.type] === 'messageDigest'
      );
      
      if (!mdAttr) return { status: 'INVALIDO', error: 'Atributo MessageDigest não encontrado.' };

      const signedHashRaw = mdAttr.value[0]?.value || mdAttr.value[0];
      const signedHash = forge.util.bytesToHex(signedHashRaw);

      // Extração do conteúdo para cálculo do Hash local
      const contentBytes = this.extractContentBytes(asn1, p7Any);
      const contentMd = isSha256 ? forge.md.sha256.create() : forge.md.sha512.create();
      contentMd.update(contentBytes);
      const actualDocHash = contentMd.digest().toHex();

      if (signedHash !== actualDocHash) {
        return { status: 'INVALIDO', error: 'A integridade falhou: o documento foi alterado.' };
      }

      // 6. Validar Autenticidade (RSA)
      const isValid = this.verifyRsaSignature(attrs, cert, signer.signature, isSha256);
      if (!isValid) return { status: 'INVALIDO', error: 'Assinatura RSA não confere.' };

      // 7. Sucesso - Extração de Metadados
      const cn = cert.subject.getField('CN')?.value ?? 'Desconhecido';
      const signingTime = this.extractSigningTime(attrs);

      return {
        status: 'VALIDO',
        error: '',
        infos: {
          nomeSignatario: String(cn),
          dataAssinatura: signingTime,
          hashDocumento: actualDocHash,
          algoritmoHash: algoName,
        },
      };

    } catch (error: any) {
      this.logger.error(`Erro crítico na verificação: ${error.message}`);
      return { status: 'INVALIDO', error: `Erro técnico: ${error.message}` };
    }
  }

  /**
   * Tenta extrair o SignerInfo navegando manualmente na árvore ASN.1
   */
  private tryManualSignerExtraction(asn1: any) {
    try {
      const signedData = asn1.value[1].value[0];
      const signerInfosAsn1 = signedData.value[signedData.value.length - 1];
      const si = signerInfosAsn1.value[0]; 
      const authAttrsAsn1 = si.value.find((v: any) => v.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && v.type === 0);

      return {
        authenticatedAttributes: authAttrsAsn1 ? authAttrsAsn1.value.map((attr: any) => ({
          type: forge.asn1.derToOid(attr.value[0].value),
          value: attr.value[1].value.map((v: any) => v.value),
          rawContext: attr 
        })) : [],
        signature: si.value[si.value.length - 1].value,
        digestAlgorithm: forge.asn1.derToOid(si.value[2].value[0].value)
      };
    } catch {
      return null;
    }
  }

  private extractContentBytes(asn1: any, p7Any: any): string {
    try {
      const signedData = asn1.value[1].value[0];
      const encapContentInfo = signedData.value[2];
      return encapContentInfo.value[1].value[0].value;
    } catch {
      return p7Any.content.getBytes ? p7Any.content.getBytes() : p7Any.content;
    }
  }

  private verifyRsaSignature(attrs: any[], cert: any, signature: string, isSha256: boolean): boolean {
    const attrSet = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, []) as any;
    attrs.forEach((attr: any) => {
      if (attr.rawContext) attrSet.value.push(attr.rawContext);
    });

    const bytesToVerify = forge.asn1.toDer(attrSet).getBytes();
    const verifyMd = isSha256 ? forge.md.sha256.create() : forge.md.sha512.create();
    verifyMd.update(bytesToVerify);
    
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    return publicKey.verify(verifyMd.digest().getBytes(), signature);
  }

  private extractSigningTime(attrs: any[]): string {
    const SIGNING_TIME_OID = '1.2.840.113549.1.9.5';
    const timeAttr = attrs.find((a: any) => a.type === SIGNING_TIME_OID || a.type === forge.pki.oids.signingTime);

    if (!timeAttr) return new Date().toISOString();

    let rawDate = Array.isArray(timeAttr.value) ? timeAttr.value[0] : timeAttr.value;
    if (rawDate?.value) rawDate = rawDate.value;

    // Parser para UTCTime (YYMMDDHHMMSSZ)
    if (typeof rawDate === 'string' && /^\d{12}Z$/.test(rawDate)) {
      const year = parseInt(rawDate.substring(0, 2), 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const d = new Date(Date.UTC(fullYear, 
        parseInt(rawDate.substring(2, 4), 10) - 1, 
        parseInt(rawDate.substring(4, 6), 10),
        parseInt(rawDate.substring(6, 8), 10),
        parseInt(rawDate.substring(8, 10), 10),
        parseInt(rawDate.substring(10, 12), 10)
      ));
      return d.toISOString();
    }

    const d = new Date(rawDate);
    return !isNaN(d.getTime()) ? d.toISOString() : String(rawDate);
  }
}