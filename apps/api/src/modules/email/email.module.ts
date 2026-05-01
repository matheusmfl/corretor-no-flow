import { Module } from '@nestjs/common';
import { ResendEmailService } from './application/services/resend-email.service';
import { EMAIL_SERVICE } from './email.constants';

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: ResendEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
