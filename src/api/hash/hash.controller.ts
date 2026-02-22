import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HashService } from './hash.service';
import { HashResponseDto } from './dto/hash-response.dto';

@Controller()
export class HashController {
  constructor(private readonly hashService: HashService) {}

  @Post('hash-file') // endpoint
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no form-data
  async getHash(@UploadedFile() file: Express.Multer.File): Promise<HashResponseDto> {
    if (!file) {
        throw new BadRequestException('É necessário enviar um arquivo');
    }
    if (!file.originalname.match(/\.(txt)$/i)) {
        throw new BadRequestException('Apenas arquivos .txt são permitidos');
    }
    
    return this.hashService.calculateFileHash(file);
  }
}