import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';

@Injectable()
export class CmsSignService {
  sign({ fileBuffer, pkcs12Buffer, password }: {
    fileBuffer: Buffer; 
    pkcs12Buffer: Buffer; 
    password: string
  }) : Buffer {
    // 1. PKCS12 to ASN.1
    const p12Der = forge.util.createBuffer(pkcs12Buffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);

    // 2. Parse PKCS12
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // 3. Extract key + certificate
    const keyBag = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });

    const keyBags = keyBag[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!keyBags || keyBags.length === 0) {
      throw new Error('Falha ao obter keybags');
    }

    const privateKey = keyBags[0].key;

    if (!privateKey) {
      throw new Error('Chave privada não encontrada no PKCS12');
    }

    const certBag = p12.getBags({
      bagType: forge.pki.oids.certBag,
    });

    const certBags = certBag[forge.pki.oids.certBag];

    if (!certBags || certBags.length === 0) {
      throw new Error('Falha ao obter certbags');
    }

    const certificate = certBags[0].cert;

    if (!certificate) {
      throw new Error('Certificado não encontrado no PKCS12');
    }

    // 4. Create PKCS#7 (CMS) SignedData
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));

    p7.addCertificate(certificate);

    p7.addSigner({
      key: privateKey,
      certificate,
      digestAlgorithm: forge.pki.oids.sha512,
    });

    // 5. Sign (attached)
    p7.sign({ detached: false });

    // 6. Export .p7s
    const asn1 = p7.toAsn1();
    const der = forge.asn1.toDer(asn1).getBytes();

    return Buffer.from(der, 'binary');
  }
}
