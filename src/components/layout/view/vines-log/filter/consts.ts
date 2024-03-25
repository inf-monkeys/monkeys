import { Workflow } from '@io-orkes/conductor-javascript';

export const EXECUTION_STATUS_LIST: { status: Workflow['status']; text: string }[] = [
  { status: 'RUNNING', text: '进行中' },
  { status: 'COMPLETED', text: '已完成' },
  { status: 'PAUSED', text: '已暂停' },
  { status: 'FAILED', text: '失败' },
  { status: 'TIMED_OUT', text: '已超时' },
  { status: 'TERMINATED', text: '已终止' },
];
