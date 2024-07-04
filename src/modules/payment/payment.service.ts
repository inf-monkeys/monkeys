import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { PaymentBalanceDto, PaymentGetOrderDto } from '@/modules/payment/dto';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { toNumber } from 'lodash';

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

  public async getOrders(teamId: string, query?: PaymentGetOrderDto): Promise<[any[], number]> {
    const { enabled, baseUrl } = config.paymentServer;
    if (!enabled || !baseUrl) {
      throw new Error('Payment server is not enabled');
    }

    const api = `/payment/get-orders`;
    let success: boolean;
    let message: string;
    let orders: any[];
    let total = 0;
    try {
      const { data } = await axios<{ success: boolean; message: string; data: any[]; total: number }>({
        method: 'POST',
        url: api,
        baseURL: baseUrl,
        headers: {
          'x-monkeys-appid': config.server.appId,
          'x-monkeys-teamid': teamId,
        },
        data: query,
      });
      success = data.success;
      message = data.message;
      orders = data.data;
      total = toNumber(data.total);
    } catch (error) {
      logger.warn(`Fetch orders failed: ${error.message}`);
      success = false;
    }
    if (!success) {
      logger.warn(`Fetch orders failed: ${message}`);
      throw new Error(message ?? 'Fetch orders failed');
    }

    return [orders, total];
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

  public async getOrderById(orderId: string) {
    const { enabled, baseUrl } = config.paymentServer;
    if (!enabled || !baseUrl) {
      throw new Error('Payment server is not enabled');
    }

    const api = `/payment/orders/${orderId}`;
    let success: boolean;
    let message: string;
    let order: any;
    try {
      const { data } = await axios<{ success: boolean; message: string; data: any }>({
        method: 'GET',
        url: api,
        baseURL: baseUrl,
        headers: {
          'x-monkeys-appid': config.server.appId,
        },
      });
      success = data.success;
      message = data.message;
      order = data.data;
    } catch (error) {
      logger.warn(`Fetch order failed: ${error.message}`);
      success = false;
    }
    if (!success) {
      logger.warn(`Fetch order failed: ${message}`);
      throw new Error(message ?? 'Fetch order failed');
    }

    return order;
  }

  public async closeOrder(orderId: string) {
    const { enabled, baseUrl } = config.paymentServer;
    if (!enabled || !baseUrl) {
      throw new Error('Payment server is not enabled');
    }

    const api = `/payment/orders/${orderId}`;
    let success: boolean;
    let message: string;
    try {
      const { data } = await axios<{ success: boolean; message: string }>({
        method: 'DELETE',
        url: api,
        baseURL: baseUrl,
        headers: {
          'x-monkeys-appid': config.server.appId,
        },
      });
      success = data.success;
      message = data.message;
    } catch (error) {
      logger.warn(`Close order failed: ${error.message}`);
      success = false;
    }
    if (!success) {
      logger.warn(`Close order failed: ${message}`);
      throw new Error(message ?? 'Close order failed');
    }
  }
}
