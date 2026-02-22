import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VerifyService } from './verify.service';
import { VerifyResponseDto } from './dto/verify-response.dto';

@Controller()
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Post('verify')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async verify(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
    },
  ): Promise<VerifyResponseDto> {

    const documentFile = files?.file?.[0];
    if (!documentFile) {
      throw new BadRequestException('O arquivo a ser verificado é obrigatório');
    }

    try {
      const result = this.verifyService.verifySignature(documentFile.buffer) as VerifyResponseDto;

      if (result.status === 'INVALIDO') {
      return { 
        status: 'INVALIDO', 
        error: result.error || 'Assinatura inválida.' 
      };
    }

      return result; // Retorna status: 'VALIDO' e infos
    } catch (error) {
      return { status: 'INVALIDO', error: error.message };
    }
  }
}
