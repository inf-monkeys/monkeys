import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';

export const getExecutionStatusText = (
  status: VinesNodeExecutionTask['status'] | string,
  workflowStatus: VinesWorkflowExecutionType | string,
) => {
  switch (status) {
    case 'COMPLETED':
      return '运行完毕';
    case 'CANCELED':
      return '已取消';
    case 'SKIPPED':
      return '已跳过';
    case 'TIMED_OUT':
      return '超时';
    case 'FAILED':
      return '失败';
    case 'FAILED_WITH_TERMINAL_ERROR':
      return '失败';
    case 'IN_PROGRESS':
      return '运行中';
    case 'SCHEDULED':
      return '已计划 / 正在运行中';
    case 'RUNNING':
      return '运行中';
    case 'TERMINATED':
      return '已终止';
    default:
      return workflowStatus === 'PAUSED'
        ? '工作流运行已暂停'
        : workflowStatus === 'SCHEDULED'
          ? '已计划，等待工作流运行准备'
          : '未知状态';
  }
};
