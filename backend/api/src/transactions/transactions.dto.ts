import { IsString, IsNumber, IsOptional, IsPositive, IsIn } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsIn(['PURCHASE', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT'])
  type: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
