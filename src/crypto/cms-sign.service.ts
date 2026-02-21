import { Injectable, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';

@Injectable()
export class CmsSignService {
  sign({ fileBuffer, pkcs12Buffer, password }: {
    fileBuffer: Buffer; 
    pkcs12Buffer: Buffer; 
    password: string
  }): Buffer {
    try {
      // Parse PKCS12
      const p12Der = forge.util.createBuffer(pkcs12Buffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Buscar pelo ALIAS solicitado no desafio
      const targetAlias = 'e2618a8b-20de-4dd2-b209-70912e3177f4';
      
      // No node-forge, buscar o bag pelo Alias
      const bags = p12.getBags({ friendlyName: targetAlias });
      
      // Valida a existência de bags
      if (!bags) {
        throw new BadRequestException(`Nenhum bag encontrado para o alias: ${targetAlias}`);
      }
      // Extrai os arrays (ou undefined)
      const certBag = bags[forge.pki.oids.certBag]?.[0];
      const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] || 
                     bags[forge.pki.oids.keyBag]?.[0];
      
      // Valida a existência do certificado e chave
      if (!certBag) {
        throw new BadRequestException(`Certificado não encontrado para o alias: ${targetAlias}`);
      }
      if (!keyBag) {
        throw new BadRequestException(`Chave privada não encontrada para o alias: ${targetAlias}`);
      }
      // Agora o TS sabe que são válidos (não são mais undefined)
      const certificate = certBag.cert as forge.pki.Certificate;
      const privateKey = keyBag.key as forge.pki.PrivateKey;

      // Criar PKCS#7 (CMS) SignedData
      const p7 = forge.pkcs7.createSignedData();
      
      // Conteúdo a ser assinado
      p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));

      p7.addCertificate(certificate);

      // Configurar Signer com SHA-512 e Atributos Autenticados
      p7.addSigner({
        key: privateKey as any, // Cast para 'any' para evitar conflito de namespace
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha512,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data,
          },
          {
            type: forge.pki.oids.messageDigest,
            // Remova o campo value ou use as any para o Forge preencher automaticamente
          } as any, 
          {
            type: forge.pki.oids.signingTime,
            // O Forge espera que a data seja formatada internamente, 
            // mas o tipo exige string. Usamos cast para satisfazer o compilador.
            value: new Date() as any,
          },
        ],
      });

      // Gerar assinatura (Attached conforme o padrão .p7s)
      p7.sign({ detached: false });

      // Exportar para DER (formato binário do .p7s)
      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();

      return Buffer.from(der, 'binary');
    } catch (e) {
      throw new BadRequestException(`Erro na assinatura CMS: ${e.message}`);
    }
  }
}