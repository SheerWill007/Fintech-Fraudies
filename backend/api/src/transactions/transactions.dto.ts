import { IsString, IsNumber, IsOptional, IsPositive, IsIn } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsIn(['PURCHASE', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT', 'PAYMENT'])
  type: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class RiskAssessmentDto {
  @IsString()
  transactionId: string;

  @IsNumber()
  riskScore: number;

  @IsString()
  @IsIn(['APPROVED', 'PENDING', 'FLAGGED'])
  status: string;

  @IsOptional()
  factors?: string[];
}
