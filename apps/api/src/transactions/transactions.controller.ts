import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WebhookSecretGuard } from './webhook-secret.guard';
import { CreateTransactionDto } from './transactions.dto';

interface IRequest {
  user: { id: string };
}

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats() {
    return this.transactionsService.getDashboardStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: IRequest) {
    return this.transactionsService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: IRequest, @Body() data: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req.user.id, data);
  }

  @UseGuards(WebhookSecretGuard)
  @Post('webhook')
  handleWebhook(@Body() data: CreateTransactionDto) {
    // Ingest transactions from external sources
    return this.transactionsService.createTransaction(data.userId, data);
  }
}
