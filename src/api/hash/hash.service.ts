import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { HashResponseDto } from './dto/hash-response.dto';

@Injectable()
export class HashService {
  // Use Express.Multer.File aqui para bater com o Controller
  calculateFileHash(file: Express.Multer.File): HashResponseDto {
    const md = forge.md.sha512.create();
    
    // O buffer do arquivo no servidor está em file.buffer
    md.update(file.buffer.toString('binary'));
    const hashedDoc = md.digest().toHex();

    return {
      file: file.originalname,
      hashedDoc: hashedDoc,
    };
  }
}