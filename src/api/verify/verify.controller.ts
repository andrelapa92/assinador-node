import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CmsVerifyService } from 'src/crypto/cms-verify.service';
import { VerifyResponseDto } from './dto/verify-response.dto';

@Controller()
export class VerifyController {
  constructor(private readonly cmsVerifyService: CmsVerifyService) {}

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
      const result = this.cmsVerifyService.verify(documentFile.buffer) as VerifyResponseDto;

      // O service agora já retorna o objeto no formato correto ou com erro
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
