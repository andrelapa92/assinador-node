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
    if (!files?.file?.length) {
      throw new BadRequestException('Arquivo assinado não informado');
    }

    return this.verifyService.verifySignature(files.file[0].buffer);
  }
}
