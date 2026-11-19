import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/infrastructure/security/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../auth/infrastructure/security/authenticated-user';
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import {
  DEFAULT_LIMIT,
  GetHistoryUseCase,
} from '../../application/get-history.use-case';
import {
  CreateTransactionDto,
  HistoryQueryDto,
  toResponse,
  TransactionResponse,
} from './transactions.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getHistory: GetHistoryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an exchange request with the latest rate' })
  @ApiCreatedResponse({ type: TransactionResponse })
  @ApiBadRequestResponse({ description: 'Invalid amount or currencies' })
  @ApiServiceUnavailableResponse({
    description: 'There is no exchange rate registered yet',
  })
  async create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransactionResponse> {
    const transaction = await this.createTransaction.execute({
      userId: user.id,
      from: dto.monedaOrigen,
      to: dto.monedaDestino,
      amount: dto.monto,
    });
    return toResponse(transaction);
  }

  @Get('history')
  @ApiOperation({
    summary:
      'Transactions between two dates. A user sees their own; an admin can send userId',
  })
  @ApiOkResponse({
    type: [TransactionResponse],
    headers: {
      'X-Total-Count': {
        description: 'Matches in the whole range',
        schema: { type: 'integer' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid or inverted date range' })
  async history(
    @Query() query: HistoryQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TransactionResponse[]> {
    const result = await this.getHistory.execute({
      requesterId: user.id,
      requesterRole: user.role,
      startDate: query.startDate,
      endDate: query.endDate,
      userId: query.userId,
      page: query.page,
      limit: query.limit,
    });
    response.setHeader('X-Total-Count', String(result.total));
    response.setHeader('X-Page', String(query.page ?? 1));
    response.setHeader('X-Limit', String(query.limit ?? DEFAULT_LIMIT));
    return result.items.map(toResponse);
  }
}
