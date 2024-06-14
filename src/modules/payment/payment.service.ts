import { Injectable } from '@nestjs/common';
import { config } from '@/common/config';
import axios from 'axios';
import { logger } from '@/common/logger';
import { toNumber } from 'lodash';
import { PaymentBalanceDto } from '@/modules/payment/dto';

@Injectable()
export class PaymentService {
  constructor() {}

  public async getBalance(userId: string, teamId: string) {
    const { enabled, baseUrl } = config.paymentServer;
    if (!enabled || !baseUrl) {
      throw new Error('Payment server is not enabled');
    }

    const api = '/payment/get-balance';
    let success: boolean;
    let message: string;
    let balance: PaymentBalanceDto;
    try {
      const { data } = await axios<{ success: boolean; message: string; data: PaymentBalanceDto }>({
        method: 'GET',
        url: api,
        baseURL: baseUrl,
        headers: {
          'x-monkeys-appid': config.server.appId,
          'x-monkeys-userid': userId,
          'x-monkeys-teamid': teamId,
        },
      });
      success = data.success;
      message = data.message;
      balance = data.data;
    } catch (error) {
      logger.warn(`Fetch balance failed: ${error.message}`);
      success = false;
    }
    if (!success) {
      logger.warn(`Fetch balance failed: ${message}`);
      throw new Error(message ?? 'Fetch balance failed');
    }

    return balance;
  }

  public async createOrder(userId: string, teamId: string, amount: number) {
    const { enabled, baseUrl } = config.paymentServer;
    if (!enabled || !baseUrl) {
      throw new Error('Payment server is not enabled');
    }

    const api = '/payment/orders';
    let success: boolean;
    let message: string;
    let order: any;
    try {
      const { data } = await axios<{ success: boolean; message: string; data: any }>({
        method: 'POST',
        url: api,
        baseURL: baseUrl,
        headers: {
          'x-monkeys-appid': config.server.appId,
          'x-monkeys-userid': userId,
          'x-monkeys-teamid': teamId,
        },
        data: {
          amount,
        },
      });
      success = data.success;
      message = data.message;
      order = data.data;
    } catch (error) {
      logger.warn(`Create order failed: ${error.message}`);
      success = false;
    }
    if (!success) {
      logger.warn(`Create order failed: ${message}`);
      throw new Error(message ?? 'Create order failed');
    }

    return order;
  }
}
