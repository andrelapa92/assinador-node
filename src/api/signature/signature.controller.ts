import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SignatureService } from './signature.service';
import { SignResponseDto } from './dto/sign-response.dto';

@Controller()
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  @Post('signature')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'pkcs12', maxCount: 1 },
    ]),
  )
  async sign(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      pkcs12?: Express.Multer.File[];
    },
    @Body('password') password: string,
  ): Promise<SignResponseDto> {
    const documentFile = files?.file?.[0];
    const certificateFile = files?.pkcs12?.[0];

    if (!documentFile) {
      throw new BadRequestException('O arquivo a ser assinado é obrigatório');
    }
    if (!certificateFile) {
      throw new BadRequestException('O certificado digital (PKCS12) é obrigatório');
    }
    if (!password) {
      throw new BadRequestException('A senha do certificado é obrigatória');
    }

    return this.signatureService.signDocument(
      documentFile.buffer,
      certificateFile.buffer,
      password,
    );
  }

}
