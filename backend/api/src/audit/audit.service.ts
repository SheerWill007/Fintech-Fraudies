import { Injectable } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  transactionId: string;
  statusBefore: TransactionStatus;
  statusAfter: TransactionStatus;
  riskScore: number;
  actorId: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry.
   * This is the only operation exposed — no update() or delete() methods exist.
   * Audit logs are append-only by design.
   */
  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        transactionId: data.transactionId,
        statusBefore: data.statusBefore,
        statusAfter: data.statusAfter,
        riskScore: data.riskScore,
        actorId: data.actorId,
        reason: data.reason,
      },
    });
  }
}
