import React from 'react';

import { useSWRConfig } from 'swr';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useTriggerRemove, useTriggerTypes, useTriggerUpdate } from '@/apis/workflow/trigger';
import { ITriggerType, IVinesTrigger } from '@/apis/workflow/trigger/typings.ts';
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Switch } from '@/components/ui/switch';
import { VinesIcon } from '@/components/ui/vines-icon';

interface ITriggerProps {
  workflowId: string;
  workflowVersion: number;
  trigger: IVinesTrigger;
}

export const Trigger: React.FC<ITriggerProps> = ({ trigger, workflowVersion, workflowId }) => {
  const { type, _id, enabled } = trigger;

  const { mutate } = useSWRConfig();

  const { data: triggerTypes } = useTriggerTypes();

  const { trigger: updateTrigger } = useTriggerUpdate(workflowId, _id);
  const { trigger: removeTrigger } = useTriggerRemove(workflowId, _id);

  const handleEnableChange = (val: boolean) => {
    toast.promise(updateTrigger({ enabled: val }), {
      loading: '正在更新触发器...',
      success: () => {
        void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
        return '触发器更新成功';
      },
      error: '触发器更新失败',
    });
  };

  const handleRemove = () => {
    toast.promise(removeTrigger(), {
      loading: '正在删除触发器...',
      success: () => {
        void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
        return '触发器删除成功';
      },
      error: '触发器删除失败',
    });
  };

  const { icon, displayName, description } = (triggerTypes?.find((it) => it.type === type) || {}) as ITriggerType;

  return (
    <Card className="relative">
      <CardHeader className="relative pl-20">
        <div className="absolute left-0 top-0 flex size-full items-center justify-between px-6">
          <VinesIcon src={icon} size="md" />
          <Switch checked={enabled} onCheckedChange={handleEnableChange} />
        </div>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="text-red-10 [&_svg]:stroke-red-10" variant="outline" icon={<Trash2 />} size="small">
              删除触发器
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定要删除此触发器吗</AlertDialogTitle>
              <AlertDialogDescription>删除后将无法恢复，请确认是否删除此触发器</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove}>确认删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};
