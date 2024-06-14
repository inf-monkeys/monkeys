import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from '@/modules/payment/payment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { SuccessResponse } from '@/common/response';
import { PaymentOrderDto } from '@/modules/payment/dto';

@Controller('/payment')
@ApiTags('Payment')
@UseGuards(CompatibleAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('/balances')
  @ApiOperation({
    summary: 'Get balance',
    description: '',
  })
  public async getBalance(@Req() req: IRequest) {
    const { teamId, userId } = req;
    const balance = await this.paymentService.getBalance(userId, teamId);
    return new SuccessResponse({
      data: balance,
    });
  }

  @Post('/orders')
  @ApiOperation({
    summary: 'Create order',
    description: '',
  })
  public async createOrder(@Req() req: IRequest, @Body() body: PaymentOrderDto) {
    const { teamId, userId } = req;
    const order = await this.paymentService.createOrder(userId, teamId, body.amount);
    return new SuccessResponse({
      data: order,
    });
  }
}
