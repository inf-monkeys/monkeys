import { IBaseEntity } from '@/apis/typings.ts';

export interface ITeamBalance {
  amount: number;
  totalConsume: number;
  totalReCharge: number;
}

export type IOrderStatus = 'created' | 'paid' | 'cancelled' | 'completed';
export type IOrderType = 'incr' | 'decr';
export type IOrderTag = 'block-consume' | 'recharge' | 'block-consume-refund' | 'admin-recharge';

export interface IBaseOrder extends IBaseEntity {
  tag: IOrderTag;
  type: IOrderType;
  status: IOrderStatus;
  // 金额，CNY，单位为分
  amount: number;
  teamId: string;
  creatorUserId: string;
  detail: any;
}

export interface IRechargeOrder extends IBaseOrder {
  tag: 'recharge';
  type: 'incr';
  detail: {
    type: 'wxpay';
    qrcode?: string;
    extraInfo?: unknown;
  };
}

export interface IBlockConsumeOrder extends IBaseOrder {
  tag: 'block-consume';
  type: 'decr';
  status: 'created' | 'cancelled' | 'completed';
  detail: {
    workflowId: string;
    workflowInstanceId: string;
    jobInstanceId: string;
    blockName: string;
  };
}

export interface IBlockConsumeRefundOrder extends IBaseOrder {
  tag: 'block-consume-refund';
  type: 'incr';
  status: 'created' | 'cancelled' | 'completed';
  detail: {
    workflowId: string;
    workflowInstanceId: string;
    jobInstanceId: string;
    blockName: string;
  };
}

export interface IAdminRechargeOrder extends IBaseOrder {
  tag: 'admin-recharge';
  type: 'incr';
  detail: {
    reason: string;
  };
}

export type IOrder = IBlockConsumeOrder | IBlockConsumeRefundOrder | IRechargeOrder | IAdminRechargeOrder;
