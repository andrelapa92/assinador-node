import { Module } from '@nestjs/common';
import { SignatureModule } from './api/signature/signature.module';
import { VerifyModule } from './api/verify/verify.module';

@Module({
  imports: [SignatureModule, VerifyModule],
})
export class AppModule {}
