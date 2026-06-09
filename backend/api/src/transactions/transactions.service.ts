import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto } from './transactions.dto';

@Injectable()
export class TransactionsService {
  private mlEngineUrl: string;
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.mlEngineUrl = this.configService.get<string>('ML_ENGINE_URL') || 'http://localhost:8000';
  }

  async createTransaction(userId: string, data: CreateTransactionDto) {
    // 1. Create the transaction in PENDING state
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: data.amount,
        currency: data.currency || 'USD',
        type: data.type,
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
        status: 'PENDING',
      },
    });

    // 2. Call ML Engine for risk assessment (asynchronous; uses owner userId, not body)
    void this.processRiskAssessment(transaction.id, userId, data);

    return transaction;
  }

  async processRiskAssessment(
    transactionId: string,
    userId: string,
    data: CreateTransactionDto,
  ) {
    try {
      const response = await fetch(`${this.mlEngineUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          userId,
          amount: data.amount,
          type: data.type,
          ipAddress: data.ipAddress,
          deviceId: data.deviceId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `ML Engine prediction failed: ${response.status} - ${errorText}`,
          { transactionId },
        );
        
        // Mark transaction as pending review when ML engine fails
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: { status: 'PENDING' },
        });
        return;
      }

      const result = await response.json();
      
      // Update transaction with risk score and new status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          riskScore: result.riskScore,
          status: result.status,
        },
      });

      // Log audit trail
      await this.prisma.auditLog.create({
        data: {
          action: 'RISK_ASSESSMENT_COMPLETED',
          entityType: 'TRANSACTION',
          entityId: transactionId,
          details: result,
        },
      });

      this.logger.log(
        `Risk assessment completed: ${transactionId} - Score: ${result.riskScore}, Status: ${result.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Unexpected error during risk assessment: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        { transactionId },
      );
      
      // Mark transaction as pending review on unexpected errors
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'PENDING' },
      }).catch((updateError) => {
        this.logger.error(
          `Failed to update transaction status after ML error: ${updateError.message}`,
          { transactionId },
        );
      });
    }
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardStats() {
    const totalVolume = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
    });
    
    const count = await this.prisma.transaction.count();
    
    const flaggedCount = await this.prisma.transaction.count({
      where: { status: 'FLAGGED' },
    });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      transactionCount: count,
      flaggedCount,
    };
  }
}


// ============================================================
// apps/ml-engine
// ============================================================