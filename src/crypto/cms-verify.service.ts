import * as forge from 'node-forge';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CmsVerifyService {
  verify(cmsBuffer: Buffer) {
    // CMS (Base64) → DER → ASN.1
    const der = forge.util.decode64(cmsBuffer.toString('utf8'));
    const asn1 = forge.asn1.fromDer(der);

    // Cast consciente (limitação de typings do node-forge)
    const p7 = forge.pkcs7.messageFromAsn1(asn1) as forge.pkcs7.PkcsSignedData;

    // Garantia estrutural para ESLint + runtime
    if (!('certificates' in p7) || !p7.certificates?.length) {
      throw new Error('Nenhum certificado encontrado na assinatura');
    }

    const signerCert = p7.certificates[0];

    type X509Field = {
      value?: string;
    };

    const cnField = signerCert.subject.getField('CN') as X509Field | null;

    const signerCommonName =
      typeof cnField?.value === 'string' ? cnField.value : 'Desconhecido';

    // Carrega cadeia de confiança
    const caStore = forge.pki.createCaStore(
      fs
        .readdirSync(path.resolve('resources/cadeia'))
        .map((file) =>
          fs.readFileSync(path.join('resources/cadeia', file), 'binary'),
        ),
    );

    // Verificação criptográfica
    type Pkcs7Verifiable = {
      verify: (options: unknown) => unknown;
    };

    function verifyPkcs7(
      p7: Pkcs7Verifiable,
      caStore: forge.pki.CAStore,
    ): boolean {
      const result = p7.verify({ caStore });

      if (typeof result !== 'boolean') {
        throw new Error('PKCS7 verify returned non-boolean value');
      }

      return result;
    }

    const valid = verifyPkcs7(p7 as unknown as Pkcs7Verifiable, caStore);

    if (!valid) {
      return { status: 'INVALIDO' as const };
    }

    return {
      status: 'VALIDO' as const,
      infos: {
        nomeSignatario: signerCommonName,
        algoritmoHash: 'SHA-512',
        dataAssinatura: new Date().toISOString(),
        hashDocumento: 'hash-calculado',
      },
    };
  }
}
