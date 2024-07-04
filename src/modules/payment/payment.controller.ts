import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from '@/modules/payment/payment.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { PaymentGetOrderDto, PaymentOrderDto } from '@/modules/payment/dto';

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

  @Get('/orders')
  @ApiOperation({
    summary: 'Get orders',
    description: '',
  })
  public async getOrders(@Req() req: IRequest, @Query() query: PaymentGetOrderDto) {
    const { teamId } = req;
    const [orders, total] = await this.paymentService.getOrders(teamId, query);
    return new SuccessListResponse({
      data: orders,
      page: +query?.page || 1,
      limit: +query?.limit || 24,
      total,
    });
  }

  @Get('/orders/:orderId')
  @ApiOperation({
    summary: 'Get order by id',
    description: '',
  })
  public async getOrder(@Req() req: IRequest, @Param('orderId') orderId: string) {
    const order = await this.paymentService.getOrderById(orderId);
    return new SuccessResponse({
      data: order,
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

  @Delete('/orders/:orderId')
  @ApiOperation({
    summary: 'Close order',
    description: '',
  })
  public async closeOrder(@Req() req: IRequest, @Param('orderId') orderId: string) {
    await this.paymentService.closeOrder(orderId);
    return new SuccessResponse({
      data: true,
    });
  }
}
