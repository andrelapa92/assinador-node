import { Controller, Post } from '@nestjs/common';

@Controller('signature')
export class AppController {
  @Post()
  sign() {
    return { ok: true };
  }
}
