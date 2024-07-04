import * as Joiful from 'joiful';

export class PaymentBalanceDto {
  @Joiful.number()
  amount: number;

  @Joiful.number()
  totalConsume: number;

  @Joiful.number()
  totalReCharge: number;
}

export class PaymentOrderDto {
  @Joiful.number().required()
  amount: number;
}

export class PaymentGetOrderDto {
  @Joiful.number().optional()
  page?: number;

  @Joiful.number().optional()
  limit?: number;

  @Joiful.string().optional()
  types?: string;
}
