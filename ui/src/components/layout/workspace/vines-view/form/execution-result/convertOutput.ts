import { useMemoizedFn } from 'ahooks';

import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';

export const useVinesSimplifiedExecutionResult = () => {
  const conversionOutputs = useMemoizedFn((outputs: VinesWorkflowExecutionOutputListItem[], col = 3) => {
    const result: IVinesExecutionResultItem[] = [];

    for (const execution of outputs ?? []) {
      const { output: executionOutput = [], rawOutput = {}, ...rest } = execution;

      for (const [index, it] of executionOutput.entries()) {
        const data = {
          ...rest,
          output: rawOutput,
          render: {
            ...it,
            index,
            status: rest.status,
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

        result.push(data);
        // }
      }
    }

    // 添加剩余的当前行

    return result.filter((item) => item.render.type !== 'empty');
  });

  return {
    conversionOutputs,
  };
};
