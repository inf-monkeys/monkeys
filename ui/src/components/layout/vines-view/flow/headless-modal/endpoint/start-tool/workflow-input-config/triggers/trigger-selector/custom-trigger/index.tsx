import React, { useCallback, useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { toast } from 'sonner';

import { useTriggerCreate } from '@/apis/workflow/trigger';
import { ITriggerType } from '@/apis/workflow/trigger/typings.ts';
import { VinesInputProperty } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface ICustomTriggerProps {}

export const CustomTrigger: React.FC<ICustomTriggerProps> = () => {
  const { workflowId } = useFlowStore();
  const { mutate } = useSWRConfig();

  const [open, setOpen] = useState(false);

  const { vines } = useVinesFlow();
  const { trigger: createTrigger } = useTriggerCreate(workflowId);
  const [triggerType, setTriggerType] = useState<ITriggerType | null>(null);
  const [data, setData] = useState<{ [x: string]: any }>({});

  const workflowVersion = vines.version;

  useEffect(() => {
    const handleOpen = (_wid: string, triggerType: ITriggerType) => {
      setTriggerType(triggerType);
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-custom', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-custom', handleOpen);
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!triggerType) {
      return;
    }
    // 校验参数
    const requiredPropNames = triggerType.properties?.filter((x) => x.required)?.map((x) => x.name) || [];
    for (const key of requiredPropNames) {
      const prop = triggerType.properties?.find((x) => x.name === key);
      if (!data[key]) {
        toast.error(`请配置 ${prop?.displayName} 参数`);
        return;
      }
    }

    toast.promise(
      createTrigger({
        triggerType: triggerType!.type,
        enabled: false,
        version: workflowVersion,
        extraData: data,
      }),
      {
        loading: '创建中...',
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          // 自动添加此触发器的 workflow 输入配置
          if (triggerType.workflowInputs?.length) {
            void vines.update({ variables: triggerType.workflowInputs });
          }
          return '触发器创建成功';
        },
        error: '创建失败',
      },
    );
    setOpen(false);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {triggerType && (
          <>
            <DialogTitle>{triggerType.displayName}</DialogTitle>
            <DialogDescription>{triggerType.description}</DialogDescription>
            {triggerType.properties?.map((def, index) => (
              <VinesInputProperty
                key={def.name + index}
                def={def}
                nodeId={''}
                value={undefined}
                onChange={(value: unknown) => {
                  setData((prevData) => ({
                    ...prevData, // 复制现有的 data 对象
                    [def.name]: value, // 更新或添加 'keyName' 字段
                  }));
                }}
                variableMapper={{}}
              />
            ))}
            <DialogFooter>
              <Button variant="outline" onClick={handleSubmit}>
                创建
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
