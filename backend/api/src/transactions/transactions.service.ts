import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto } from './transactions.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TransactionsService {
  private mlEngineUrl: string;
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    this.mlEngineUrl = this.configService.get<string>('ML_ENGINE_URL') || 'http://localhost:8000';
  }

  /**
   * Creates a transaction with synchronous ML scoring.
   * The README specifies a single synchronous request cycle:
   * ingest → persist PENDING → score → update status → write audit log → return.
   */
  async createTransaction(userId: string, data: CreateTransactionDto) {
    // 1. Create the transaction in PENDING state
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: data.amount,
        type: data.type as any,
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
        status: 'PENDING',
      },
    });

    // 2. Call ML Engine synchronously for risk assessment
    try {
      const response = await fetch(`${this.mlEngineUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
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
          { transactionId: transaction.id },
        );

        // Transaction remains PENDING for manual review when ML engine fails
        return transaction;
      }

      const result = await response.json();

      // 3. Update transaction with risk score, factors, and new status
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          riskScore: result.riskScore,
          riskFactors: result.factors || [],
          status: result.status,
        },
      });

      // 4. Write immutable audit log entry
      await this.auditService.create({
        transactionId: transaction.id,
        statusBefore: 'PENDING',
        statusAfter: result.status,
        riskScore: result.riskScore,
        actorId: userId,
        reason: `ML risk assessment: ${result.factors?.join(', ') || 'none'}`,
      });

      this.logger.log(
        `Transaction scored: ${transaction.id} | score=${result.riskScore} | status=${result.status}`,
      );

      return updatedTransaction;
    } catch (error) {
      this.logger.error(
        `Unexpected error during risk assessment: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Transaction remains PENDING for manual review on unexpected errors
      return transaction;
    }
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardStats() {
    const [totalResult, count, flaggedCount, approvedCount, pendingCount] =
      await Promise.all([
        this.prisma.transaction.aggregate({ _sum: { amount: true } }),
        this.prisma.transaction.count(),
        this.prisma.transaction.count({ where: { status: 'FLAGGED' } }),
        this.prisma.transaction.count({ where: { status: 'APPROVED' } }),
        this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      totalVolume: totalResult._sum.amount || 0,
      transactionCount: count,
      flaggedCount,
      approvedCount,
      pendingCount,
      approvalRate: count > 0 ? Number(((approvedCount / count) * 100).toFixed(1)) : 0,
    };
  }

  async getFlaggedTransactions() {
    return this.prisma.transaction.findMany({
      where: { status: 'FLAGGED' },
      orderBy: { createdAt: 'desc' },
    });
  }
}