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
        // OID oficial para signingTime: 1.2.840.113549.1.9.5
        const SIGNING_TIME_OID = '1.2.840.113549.1.9.5';
        
        const timeAttr = signer.authenticatedAttributes.find((a: any) => 
          a.type === SIGNING_TIME_OID || a.type === forge.pki.oids.signingTime
        );

        if (timeAttr) {
          // No ASN.1, o valor de um atributo fica dentro de um SET (value[0])
          // O Forge pode retornar como um array de bytes ou uma string UTCTime
          let rawDate = Array.isArray(timeAttr.value) ? timeAttr.value[0] : timeAttr.value;
          
          // Se for um objeto ASN.1 complexo, extraímos o valor real
          if (rawDate && typeof rawDate === 'object' && rawDate.value) {
            rawDate = rawDate.value;
          }
          
          if (typeof rawDate === 'string' && /^\d{12}Z$/.test(rawDate)) {
              // Parser manual para UTCTime: YYMMDDHHMMSSZ
              const year = parseInt(rawDate.substring(0, 2), 10);
              const fullYear = year < 50 ? 2000 + year : 1900 + year;
              const month = parseInt(rawDate.substring(2, 4), 10) - 1; // Meses no JS são 0-11
              const day = parseInt(rawDate.substring(4, 6), 10);
              const hour = parseInt(rawDate.substring(6, 8), 10);
              const min = parseInt(rawDate.substring(8, 10), 10);
              const sec = parseInt(rawDate.substring(10, 12), 10);

              const d = new Date(Date.UTC(fullYear, month, day, hour, min, sec));
              signingTime = d.toISOString();
          } else {
              const d = new Date(rawDate);
              signingTime = !isNaN(d.getTime()) ? d.toISOString() : `Data original: ${rawDate}`;
          }

        } else {
          signingTime = "Data não encontrada no arquivo";
        }
      } catch (e) {
        console.error("Erro ao extrair data:", e.message);
        signingTime = "Erro no parse da data";
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