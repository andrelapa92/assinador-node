export class VerifyResponseDto {
  status: 'VALIDO' | 'INVALIDO';
  error?: string;

  infos?: {
    nomeSignatario: string;
    dataAssinatura: string;
    hashDocumento: string;
    algoritmoHash: string;
  };
}
