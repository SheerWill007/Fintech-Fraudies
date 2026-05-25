import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { WebhookSecretGuard } from './webhook-secret.guard';

@Module({
  providers: [TransactionsService, WebhookSecretGuard],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
