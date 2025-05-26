import { JSONValue } from '@/components/ui/code-editor';
import {
  VinesWorkflowExecutionInput,
  VinesWorkflowExecutionOutputListItem,
  VinesWorkflowExecutionType,
} from '@/package/vines-flow/core/typings.ts';

type IVinesExecutionResultImageAltCopy = {
  type: 'copy-param';
  label: string;
  data: VinesWorkflowExecutionInput[];
};

export type IVinesExecutionResultItem = VinesWorkflowExecutionOutputListItem & {
  render: {
    type: 'image' | 'video' | 'text' | 'json' | 'empty';
    data: JSONValue;
    alt?:
      | string
      | string[]
      | { [imgUrl: string]: string }
      | {
          [imgUrl: string]: IVinesExecutionResultImageAltCopy;
        }
      | undefined;
    // index: number;
    key: string;
    status: VinesWorkflowExecutionType;
    isDeleted?: boolean;
  };
};

export const convertExecutionResultToItemList = (
  result: VinesWorkflowExecutionOutputListItem,
): IVinesExecutionResultItem[] => {
  return result.output.map((item, index) => {
    return {
      ...result,
      render: {
        ...item,
        key: result.instanceId + '-' + result.status + '-' + index,
        status: result.status,
      },
    };
  });
};

export const concatResultListReducer = (acc: IVinesExecutionResultItem[], current: IVinesExecutionResultItem[]) => {
  return [...acc, ...current];
};
