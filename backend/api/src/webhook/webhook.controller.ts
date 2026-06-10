import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WebhookGuard } from '../common/guards/webhook.guard';
import { TransactionsService } from '../transactions/transactions.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('transactions')
export class WebhookController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(WebhookGuard)
  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    // 1. Store raw webhook payload for replay and debugging
    await this.prisma.webhookEvent.create({
      data: {
        payload: data,
        source: 'external',
      },
    });

    // 2. Process the transaction
    const result = await this.transactionsService.createTransaction(
      data.userId,
      {
        amount: data.amount,
        type: data.type,
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
      },
    );

    return result;
  }
}
