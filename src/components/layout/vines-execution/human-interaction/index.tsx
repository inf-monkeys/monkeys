import React, { memo, useEffect, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLast, Files, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateExecutionTask } from '@/apis/workflow/execution';
import { objectToArray } from '@/components/layout/vines-execution/human-interaction/utils.ts';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface IVinesExecutionHumanInteractionProps {
  height?: number;
  instanceId: string;
  taskId: string;
  inputData: Record<string, any>;
  taskDefName: string;
  isCompleted: boolean;
}

const IMG_REGEXP = /https?:\/\/\S+\.(?:png|webp|jpg|jpeg)/i;

export const VinesExecutionHumanInteraction: React.FC<IVinesExecutionHumanInteractionProps> = memo(
  ({ height, instanceId, taskId, inputData, taskDefName, isCompleted }) => {
    const { trigger, isMutating } = useUpdateExecutionTask(instanceId, taskId);

    const [textInteracts, setTextInteracts] = useState<string[]>([]);
    const [imageInteracts, setImageInteracts] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const [disableTaskId, setDisableTaskId] = useState<string | null>(null);

    useEffect(() => {
      const tempTextList: string[] = [];
      const tempImageList: string[] = [];
      objectToArray((inputData as unknown as { diplayContent: Record<string, unknown> })?.diplayContent ?? {}).forEach(
        ({ value: it }) => {
          if (typeof it !== 'string') return;
          if (IMG_REGEXP.test(it)) {
            tempImageList.push(it);
          } else {
            tempTextList.push(it);
          }
        },
      );
      setImageInteracts(tempImageList);
      setTextInteracts(tempTextList);
    }, [inputData]);

    const handleSelected = (item: string) => {
      if (selectedItems.includes(item)) {
        setSelectedItems((prev) => prev.filter((v) => v !== item));
      } else {
        setSelectedItems((prev) => [...prev, item]);
      }
    };

    const handleOk = (choose: boolean) => {
      const outputData = {
        choose,
        selected:
          inputData?.outputType === 'array-join'
            ? selectedItems.join(inputData?.arrayJoinSeparator ?? '')
            : selectedItems,
      };
      toast.promise(trigger({ status: 'COMPLETED', outputData }), {
        loading: '正在提交...',
        success: () => {
          setDisableTaskId(taskId);
          return '提交成功';
        },
        error: '提交失败',
      });
    };

    const isEmpty = !textInteracts.length && !imageInteracts.length;
    const selectedLength = selectedItems.length;
    return (
      <div className="relative size-full" style={{ height }}>
        <AnimatePresence>
          {isCompleted || disableTaskId === taskId ? (
            <motion.div
              key={taskDefName + '_actuator_viewer-interacted'}
              className="absolute flex size-full items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
            </motion.div>
          ) : (
            <motion.div
              key={taskDefName + '_actuator_viewer'}
              className="absolute top-0 flex h-full w-full flex-col gap-2 p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <h1 className="text-xl font-bold">请进行交互</h1>
                {taskId && <span className="text-xs text-gray-500 opacity-70">任务 ID：{taskId}</span>}
              </div>
              {!isEmpty && (
                <div className="flex max-h-[25rem] w-full shrink-0 grow-0 flex-wrap items-center justify-center gap-4 overflow-x-clip rounded-md border border-input bg-muted py-2">
                  {imageInteracts.map((url, index) => (
                    <div className="relative" key={index}>
                      <img
                        className={cn(
                          'h-[150px] w-[150px] cursor-pointer rounded-md border border-input shadow-sm',
                          selectedItems.includes(url) && 'border-offset-0 outline outline-vines-500',
                        )}
                        width={150}
                        height={150}
                        src={url}
                        alt="image"
                        onClick={() => handleSelected(url)}
                      />
                    </div>
                  ))}
                  {textInteracts.map((it, index) => (
                    <div
                      className={cn(
                        'flex cursor-pointer items-center gap-1 rounded-md border border-input bg-slate-1 px-2 py-1 shadow-sm hover:bg-opacity-50',
                        selectedItems.includes(it) && 'border-offset-0 outline outline-vines-500',
                      )}
                      key={index}
                      onClick={() => handleSelected(it)}
                    >
                      <Files size={16} />
                      <p className="max-h-[76px] overflow-y-auto break-all">{it}</p>
                    </div>
                  ))}
                </div>
              )}
              <div
                className={cn(
                  'flex flex-1 items-end justify-end gap-2',
                  isEmpty && 'h-[calc(100%-44px)] scale-110 justify-center gap-4',
                )}
              >
                <Button
                  icon={<LogOut />}
                  onClick={() => handleOk(false)}
                  loading={isMutating}
                  variant="outline"
                  size="small"
                >
                  继续执行
                </Button>
                <Button
                  icon={!selectedLength ? <ChevronLast /> : <Check />}
                  onClick={() => handleOk(true)}
                  loading={isMutating}
                  variant="outline"
                  size="small"
                >
                  {selectedLength ? `确认 (${selectedLength})` : '跳过'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
VinesExecutionHumanInteraction.displayName = 'VinesExecutionHumanInteraction';
