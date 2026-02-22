import * as forge from 'node-forge';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CmsVerifyService {
  verify(cmsBuffer: Buffer) {
    try {
      let rawContent: string;
      const bufferString = cmsBuffer.toString('utf8');
      const isBase64 = /^[A-Za-z0-9+/=]+\s*$/.test(bufferString.trim());
      rawContent = isBase64 ? forge.util.decode64(bufferString) : cmsBuffer.toString('binary');

      const der = forge.util.createBuffer(rawContent);
      const asn1 = forge.asn1.fromDer(der);
      const p7 = forge.pkcs7.messageFromAsn1(asn1);
      const p7Any = p7 as any;

      // 1. Busca o Signatário (Tentativa Automática)
      let signer = (p7Any.signers?.length > 0) ? p7Any.signers[0] : (p7Any.signerInfos?.length > 0 ? p7Any.signerInfos[0] : null);

      // 2. Fallback: Extração Manual
      if (!signer) {
        try {
          const signedData = (asn1 as any).value[1].value[0];
          const signerInfosAsn1 = signedData.value[signedData.value.length - 1];
          const si = signerInfosAsn1.value[0]; 
          
          const authAttrsAsn1 = si.value.find((v: any) => v.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && v.type === 0);

          signer = {
            authenticatedAttributes: authAttrsAsn1 ? authAttrsAsn1.value.map((attr: any) => ({
              type: forge.asn1.derToOid(attr.value[0].value),
              value: attr.value[1].value.map((v: any) => v.value), // Extrai os valores do SET
              rawContext: attr 
            })) : [],
            signature: si.value[si.value.length - 1].value,
            digestAlgorithm: forge.asn1.derToOid(si.value[2].value[0].value)
          };
        } catch (e) {
          return { status: 'INVALIDO' as const, error: 'Erro ao processar estrutura manual do arquivo.' };
        }
      }

      const cert = p7Any.certificates?.[0];
      if (!cert) return { status: 'INVALIDO' as const, error: 'Certificado não encontrado.' };

      // 3. Identificar Algoritmo de Hash
      const mdOid = forge.pki.oids[signer.digestAlgorithm] || signer.digestAlgorithm;
      const isSha256 = mdOid === forge.pki.oids.sha256;
      const algoName = isSha256 ? 'SHA-256' : 'SHA-512';

      // 4. Validar Integridade (Message Digest)
      const mdAttr = signer.authenticatedAttributes.find((a: any) => 
        a.type === forge.pki.oids.messageDigest || forge.pki.oids[a.type] === 'messageDigest'
      );
      
      if (!mdAttr) return { status: 'INVALIDO' as const, error: 'MessageDigest não encontrado.' };

      // O valor assinado costuma vir encapsulado, tentamos pegar os bytes puros
      const signedHashRaw = mdAttr.value[0]?.value || mdAttr.value[0];
      const signedHash = forge.util.bytesToHex(signedHashRaw);

      const contentMd = isSha256 ? forge.md.sha256.create() : forge.md.sha512.create();
      
      // Pegar os bytes brutos do conteúdo ASN.1
      // Se o p7Any.content falhar, buscamos direto na árvore do SignedData
      let contentBytes: string;
      try {
          const signedData = (asn1 as any).value[1].value[0];
          // O conteúdo fica no índice 2 do SignedData (encapsulatedContentInfo)
          const encapContentInfo = signedData.value[2];
          // O conteúdo real fica dentro da tag [0] desse objeto
          contentBytes = encapContentInfo.value[1].value[0].value;
      } catch (e) {
          contentBytes = p7Any.content.getBytes ? p7Any.content.getBytes() : p7Any.content;
      }

      contentMd.update(contentBytes);
      const actualDocHash = contentMd.digest().toHex();

      console.log("H (Calculado):", actualDocHash);
      console.log("S (Assinado): ", signedHash);

      if (signedHash !== actualDocHash) {
        return { status: 'INVALIDO' as const, error: 'Integridade falhou: o documento foi alterado ou encoding incompatível.' };
      }

      // 5. Validar Autenticidade (RSA)
      const attrSet = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, []) as any;
      signer.authenticatedAttributes.forEach((attr: any) => {
        if (attr.rawContext) attrSet.value.push(attr.rawContext);
      });

      const bytesToVerify = forge.asn1.toDer(attrSet).getBytes();
      const verifyMd = isSha256 ? forge.md.sha256.create() : forge.md.sha512.create();
      verifyMd.update(bytesToVerify);
      
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
      const isValid = publicKey.verify(verifyMd.digest().getBytes(), signer.signature);

      if (!isValid) return { status: 'INVALIDO' as const, error: 'Assinatura RSA não confere.' };

      // 6. Sucesso - Extração final de dados
      const cn = cert.subject.getField('CN')?.value ?? 'Desconhecido';
      
      // Tratamento seguro para a data de assinatura
      let signingTime: string;
      try {
        const timeAttr = signer.authenticatedAttributes.find((a: any) => 
          a.type === forge.pki.oids.signingTime || forge.pki.oids[a.type] === 'signingTime'
        );
        
        if (timeAttr && timeAttr.value) {
          // O forge extrai a data como uma string UTCTime ou GeneralizedTime dentro do array
          const rawDate = Array.isArray(timeAttr.value) ? timeAttr.value[0] : timeAttr.value;
          // Se for um objeto ASN.1, pegamos o valor interno
          const dateValue = typeof rawDate === 'object' ? rawDate.value : rawDate;
          
          const d = new Date(dateValue);
          signingTime = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } else {
          signingTime = new Date().toISOString();
        }
      } catch (e) {
        signingTime = new Date().toISOString(); // Fallback para data atual se falhar o parse
      }

      return {
        status: 'VALIDO' as const,
        infos: {
          nomeSignatario: String(cn),
          dataAssinatura: signingTime,
          hashDocumento: actualDocHash,
          algoritmoHash: algoName,
        },
      };

    } catch (error: any) {
      console.error('Erro crítico:', error);
      return { status: 'INVALIDO' as const, error: `Erro técnico: ${error.message}` };
    }
  }
}