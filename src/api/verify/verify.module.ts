import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { CmsVerifyService } from 'src/crypto/cms-verify.service';

@Module({
  controllers: [VerifyController],
  providers: [VerifyService, CmsVerifyService],
})
export class VerifyModule {}
