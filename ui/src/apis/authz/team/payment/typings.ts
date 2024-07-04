import { IBaseEntity } from '@/apis/typings.ts';

export interface ITeamBalance {
  amount: number;
  totalConsume: number;
  totalReCharge: number;
}

export type IOrderType = 'execute_tool' | 'recharge' | 'execute_tool_refund' | 'admin_recharge';

export interface IBaseOrder extends IBaseEntity {
  type: IOrderType;
  // 金额，CNY，单位为分
  amount: number;

  teamId: string;
  userId: string;
  isDeleted: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
  id: string;
}

export interface IRechargeOrder extends IBaseOrder {
  id: string;
  platform: 'wxpay';
  amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'closed';
  qrcode?: string;
}

export interface IBlockConsumeOrder extends IBaseOrder {
  type: 'execute_tool';

  status: 'pending' | 'success' | 'failed';
  toolName: string;
  workflowId: string;
  workflowInstanceId: string;
  taskId: string;
}

export interface IBlockConsumeRefundOrder extends IBaseOrder {
  type: 'execute_tool_refund';
}

export interface IAdminRechargeOrder extends IBaseOrder {
  type: 'admin_recharge';
}

export type IOrder = IBlockConsumeOrder | IBlockConsumeRefundOrder | IRechargeOrder | IAdminRechargeOrder;
