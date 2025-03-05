import { useMemoizedFn } from 'ahooks';

import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';

const EMPTY_ITEM: IVinesExecutionResultItem = {
  createTime: 0,
  endTime: 0,
  input: [],
  instanceId: '',
  output: [],
  rawOutput: {},
  startTime: 0,
  status: 'SCHEDULED',
  taskId: '',
  teamId: '',
  updateTime: 0,
  userId: '',
  workflowId: '',
  render: { type: 'empty', data: '', index: 0 },
};

export const useVinesExecutionResult = () => {
  const conversionOutputs = useMemoizedFn((outputs: VinesWorkflowExecutionOutputListItem[], col = 3) => {
    const result: IVinesExecutionResultItem[][] = [];
    let currentRow: IVinesExecutionResultItem[] = [];

    for (const execution of outputs ?? []) {
      const { output: executionOutput = [], rawOutput = {}, ...rest } = execution;

      for (const [index, it] of executionOutput.entries()) {
        const data = {
          ...rest,
          output: rawOutput,
          render: {
            ...it,
            index,
          },
        } as unknown as IVinesExecutionResultItem;

        // const isTextOrJson = data.render.type === 'json' || data.render.type === 'text';
        //
        // if (isTextOrJson) {
        //   if (currentRow.length > 0) {
        //     // 填充当前行并添加到结果中
        //     currentRow = currentRow.concat(new Array(col - currentRow.length).fill(EMPTY_ITEM));
        //     result.push(currentRow);
        //     currentRow = [];
        //   }
        //   // 创建新行并填充空白项
        //   const newRow = [data].concat(new Array(col - 1).fill(EMPTY_ITEM));
        //   result.push(newRow);
        // } else {
        if (currentRow.length >= col) {
          result.push(currentRow);
          currentRow = [];
        }
        currentRow.push(data);
        // }
      }
    }

    // 添加剩余的当前行
    if (currentRow.length > 0) {
      result.push(currentRow);
    }

    return result.map((row) => row.filter((item) => item.render.type !== 'empty'));
  });

  return {
    conversionOutputs,
  };
};
