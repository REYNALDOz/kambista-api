import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CURRENCIES,
  type Currency,
  type Transaction,
} from '../../domain/transaction';
import { Type } from 'class-transformer';

const MAX_AMOUNT = 9_999_999.99;

export class CreateTransactionDto {
  @ApiProperty({ enum: CURRENCIES, example: 'USD' })
  @IsIn(CURRENCIES)
  monedaOrigen!: Currency;

  @ApiProperty({ enum: CURRENCIES, example: 'PEN' })
  @IsIn(CURRENCIES)
  monedaDestino!: Currency;

  @ApiProperty({ example: 100, maximum: MAX_AMOUNT })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_AMOUNT)
  monto!: number;
}

export class HistoryQueryDto {
  @ApiProperty({ example: '2024-01-01', description: 'Start of the range' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2024-01-31',
    description:
      'End of the range (a date without time includes the whole day)',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Admin only: the user whose history is requested',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page, from 1' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TransactionResponse {
  @ApiProperty({ example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  id!: string;

  @ApiProperty({ enum: CURRENCIES, example: 'USD' })
  monedaOrigen!: Currency;

  @ApiProperty({ enum: CURRENCIES, example: 'PEN' })
  monedaDestino!: Currency;

  @ApiProperty({ example: 100 })
  monto!: number;

  @ApiProperty({ example: 373.9 })
  montoCambiado!: number;

  @ApiProperty({ example: 3.739, description: 'The rate that was applied' })
  tipoCambio!: number;

  @ApiProperty({ example: '2024-01-18T15:30:00.000Z' })
  fecha!: string;
}

export function toResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id as string,
    monedaOrigen: transaction.from,
    monedaDestino: transaction.to,
    monto: transaction.amount.toNumber(),
    montoCambiado: transaction.convertedAmount.toNumber(),
    tipoCambio: transaction.appliedRate.toNumber(),
    fecha: transaction.date.toISOString(),
  };
}
