import { Module } from '@nestjs/common';
import { SignatureModule } from './api/signature/signature.module';
import { VerifyModule } from './api/verify/verify.module';
import { HashModule } from './api/hash/hash.module';

@Module({
  imports: [SignatureModule, VerifyModule, HashModule],
})
export class AppModule {}
