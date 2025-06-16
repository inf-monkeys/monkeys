import { getThumbUrl } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image';
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

export const convertExecutionResultToThumbnailList = (
  result: VinesWorkflowExecutionOutputListItem,
): IVinesExecutionResultItem[] => {
  return result.output.map((item, index) => {
    return {
      ...result,
      render: {
        ...item,
        data: getThumbUrl(item.data as string),
        key: result.instanceId + '-' + result.status + '-' + index,
        status: result.status,
      },
    };
  });
};

export const concatResultListReducer = (acc: IVinesExecutionResultItem[], current: IVinesExecutionResultItem[]) => {
  return [...acc, ...current];
};
export const newConvertExecutionResultToItemList = (
  result: VinesWorkflowExecutionOutputListItem[],
): IVinesExecutionResultItem[] => {
  return result.flatMap((output, index) => {
    return output.output.map((item, index) => {
      return {
        ...output,
        render: { ...item, key: output.instanceId + '-' + output.status + '-' + index, status: output.status },
      };
    });
  });
};
export const removeRepeatKey = (executionResultList: IVinesExecutionResultItem[]) => {
  const map = new Map<string, IVinesExecutionResultItem>();
  for (const item of executionResultList) {
    if (!map.has(item.render.key)) {
      map.set(item.render.key, item);
    }
  }
  return Array.from(map.values());
};

export const convertImageListToThumbnailList = (imageList: IVinesExecutionResultItem[]) => {
  return imageList.map((item) => {
    return {
      ...item,
      render: {
        ...item.render,
        data: getThumbUrl(item.render.data as string),
      },
    };
  });
};
