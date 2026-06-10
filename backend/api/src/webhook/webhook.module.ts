import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
