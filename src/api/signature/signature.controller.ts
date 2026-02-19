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
    if (!files?.file || !files?.pkcs12 || !password) {
      throw new BadRequestException('Parâmetros inválidos');
    }

    return this.signatureService.signDocument(
      files.file[0].buffer,
      files.pkcs12[0].buffer,
      password,
    );
  }

}
