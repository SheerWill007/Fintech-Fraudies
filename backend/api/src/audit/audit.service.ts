import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

export interface CreateAuditLogDto {
  transactionId: string;
  statusBefore: TransactionStatus;
  statusAfter: TransactionStatus;
  riskScore: number;
  actorId: string;
  reason?: string;
}

/**
 * AuditService — append-only audit log writer.
 *
 * By design, this service exposes ONLY a create() method.
 * No update() or delete() exists. The underlying PostgreSQL table
 * should also have a BEFORE UPDATE/DELETE trigger to enforce
 * immutability at the database level.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    const entry = await this.prisma.auditLog.create({
      data: {
        transactionId: dto.transactionId,
        statusBefore: dto.statusBefore,
        statusAfter: dto.statusAfter,
        riskScore: dto.riskScore,
        actorId: dto.actorId,
        reason: dto.reason,
      },
    });

    this.logger.log(
      `Audit log created: tx=${dto.transactionId} ${dto.statusBefore}→${dto.statusAfter} score=${dto.riskScore}`,
    );

    return entry;
  }
}
