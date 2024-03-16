import React from 'react';

import { cloneDeep, get, isArray, isBoolean } from 'lodash';
import { Edit, Plus, Trash2 } from 'lucide-react';

import { VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/consts.ts';
import { InputEditor } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tag } from '@/components/ui/tag';
import { TagGroup } from '@/components/ui/tag/tag-group.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import VinesEvent from '@/utils/events.ts';

interface IInputConfigProps extends React.ComponentPropsWithoutRef<'div'> {}

export const InputConfig: React.FC<IInputConfigProps> = () => {
  const { vines } = useVinesFlow();

  const inputs = vines.workflowInput.map((it) =>
    isBoolean(it.default) ? { ...it, default: it.default.toString() } : it,
  );

  const handleRemoveInput = (variableId: string) => {
    const newInputs = cloneDeep(inputs);
    const index = newInputs.findIndex((it) => it.name === variableId);
    if (index !== -1) {
      newInputs.splice(index, 1);
    }
    vines.update({ variables: newInputs });
  };

  return (
    <div className="relative flex h-80 w-full flex-col gap-4 py-2">
      <ScrollArea className="px-2">
        {inputs.map((it, index) => {
          const { name: variableId, displayName, type, default: defaultData, typeOptions } = it;
          const defaultValueType = typeof defaultData;
          const assetType = get(typeOptions, 'assetType', null);
          const multipleValues = get(typeOptions, 'multipleValues', false);
          return (
            <Card className="mb-2 flex flex-col gap-2 p-4" key={index}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="text-xxs bg-muted py-1 shadow-sm">
                    {
                      VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER[
                        type + (assetType ? `:${assetType}` : '') + (multipleValues ? '-list' : '')
                      ]
                    }
                  </Tag>
                  <h1 className="font-bold">{displayName}</h1>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    icon={<Edit />}
                    variant="outline"
                    className="scale-80"
                    onClick={() => VinesEvent.emit('flow-input-editor', vines.workflowId, variableId)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button icon={<Trash2 />} variant="outline" className="scale-80 [&_svg]:stroke-red-10" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除此输入吗</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后，此输入将不无法在工作流中使用，且无法恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveInput(variableId)}>确认删除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex flex-col gap-2 break-words rounded-sm border border-input p-2 text-xs shadow-sm">
                {defaultValueType === 'undefined' ? (
                  <p>暂无默认值</p>
                ) : (
                  <>
                    <span className="-mt-1 text-xs text-gray-10">默认值</span>
                    {defaultValueType === 'boolean' ? (
                      defaultData ? (
                        '真'
                      ) : (
                        '假'
                      )
                    ) : isArray(defaultData) ? (
                      <TagGroup
                        className="bg-slate-1/80 shadow-sm"
                        maxTagCount={10}
                        tagList={(defaultData as string[]).map((v) => {
                          const value = isBoolean(v) ? (v ? '真' : '假') : v;
                          return {
                            children: (
                              <Tooltip>
                                <TooltipTrigger>{v.length > 25 ? v.slice(0, 25) + '...' : value}</TooltipTrigger>
                                <TooltipContent>{value}</TooltipContent>
                              </Tooltip>
                            ),
                          };
                        })}
                        size="large"
                      />
                    ) : (
                      JSON.stringify(defaultData)
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </ScrollArea>
      <Button variant="outline" icon={<Plus />} onClick={() => VinesEvent.emit('flow-input-editor', vines.workflowId)}>
        新建配置
      </Button>
      <InputEditor />
    </div>
  );
};
