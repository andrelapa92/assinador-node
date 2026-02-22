import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { VerifyResponseDto } from './dto/verify-response.dto';

@Injectable()
export class VerifyService {

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

      // 2. Busca o Signatário (SignerInfo) - Tentando múltiplos nomes de propriedade
      const signer = (p7Any.signers && p7Any.signers.length > 0) 
                     ? p7Any.signers[0] 
                     : (p7Any.signerInfos && p7Any.signerInfos.length > 0)
                        ? p7Any.signerInfos[0]
                        : null;

      if (!signer) {
        return { status: 'INVALIDO', error: 'SignerInfo não encontrado na assinatura.' };
      }

      // 3. Busca o Certificado do Signatário
      const cert = p7Any.certificates?.[0];
      if (!cert) {
        return { status: 'INVALIDO', error: 'Certificado não encontrado na estrutura PKCS7.' };
      }

      // 4. Extrai Atributos Autenticados
      const attrs = (signer.authenticatedAttributes || signer.authAttributes || []) as any[];
      if (attrs.length === 0) {
        return { status: 'INVALIDO', error: 'Atributos autenticados não encontrados.' };
      }

      // 5. Verificação de Integridade (Hash do Documento)
      const mdAttr = attrs.find(a => a.type === forge.pki.oids.messageDigest || forge.pki.oids[a.type] === 'messageDigest');
      if (!mdAttr) {
        return { status: 'INVALIDO', error: 'Atributo MessageDigest não encontrado.' };
      }

      const signedHash = forge.util.bytesToHex(mdAttr.value[0]);
      const actualDocHash = forge.md.sha512.create().update(p7Any.content.getBytes()).digest().toHex();

      if (signedHash !== actualDocHash) {
        return { status: 'INVALIDO', error: 'A integridade falhou: o documento foi alterado.' };
      }

      // 6. Verificação de Autenticidade (Criptografia RSA)
      // Reconstruímos o SET de atributos usando o rawContext para evitar erros de length e hash
      const attrSet = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, []) as any;
      for (const attr of attrs) {
        if (attr.rawContext) {
          attrSet.value.push(attr.rawContext);
        }
      }

      const bytesToVerify = forge.asn1.toDer(attrSet).getBytes();
      const md = forge.md.sha512.create().update(bytesToVerify);
      
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
      const isValid = publicKey.verify(md.digest().getBytes(), signer.signature);

      if (!isValid) {
        return { status: 'INVALIDO', error: 'Assinatura digital inválida (criptografia não confere).' };
      }

      // 7. Sucesso - Extração final de dados
      const cn = cert.subject.getField('CN')?.value ?? 'Desconhecido';
      let signingTime = new Date().toISOString();

      const timeAttr = attrs.find(a => 
        a.type === forge.pki.oids.signingTime || 
        a.type === 'signingTime' ||
        forge.pki.oids[a.type] === 'signingTime'
      );

      if (timeAttr?.value?.[0]) {
        const dateValue = timeAttr.value[0].value || timeAttr.value[0];
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          signingTime = parsedDate.toISOString();
        }
      }

      return {
        status: 'VALIDO',
        error: '',
        infos: {
          nomeSignatario: String(cn),
          dataAssinatura: signingTime,
          hashDocumento: actualDocHash,
          algoritmoHash: 'SHA-512',
        },
      };

    } catch (error: any) {
      console.error('Erro na Verificação:', error);
      return { status: 'INVALIDO', error: `Erro técnico: ${error.message}` };
    }
  }
}