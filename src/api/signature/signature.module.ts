import { Module } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';
import { CmsSignService } from '../../crypto/cms-sign.service';

@Module({
  controllers: [SignatureController],
  providers: [SignatureService, CmsSignService],
})
export class SignatureModule {}
