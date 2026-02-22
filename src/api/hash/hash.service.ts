import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { HashResponseDto } from './dto/hash-response.dto';

@Injectable()
export class HashService {
  calculateFileHash(file: Express.Multer.File): HashResponseDto {
    const md = forge.md.sha512.create();
    md.update(file.buffer.toString('binary'));
    const hash = md.digest().toHex();

    return {
      file: file.originalname,
      hash: hash,
    };
  }
}