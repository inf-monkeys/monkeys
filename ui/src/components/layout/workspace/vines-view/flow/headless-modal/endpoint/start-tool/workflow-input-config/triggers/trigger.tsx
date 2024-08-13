import React from 'react';

import { useSWRConfig } from 'swr';

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Switch } from '@/components/ui/switch';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface ITriggerProps {
  workflowId: string;
  workflowVersion: number;
  trigger: IVinesTrigger;
}

export const Trigger: React.FC<ITriggerProps> = ({ trigger, workflowVersion, workflowId }) => {
  const { t } = useTranslation();

  const { type, id, enabled } = trigger;

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);

  const { mutate } = useSWRConfig();

  const { data: triggerTypes } = useTriggerTypes();

  const { trigger: updateTrigger } = useTriggerUpdate(workflowId, id);
  const { trigger: removeTrigger } = useTriggerRemove(workflowId, id);

  const handleEnableChange = (val: boolean) => {
    toast.promise(updateTrigger({ enabled: val }), {
      loading: t('workspace.flow-view.endpoint.start-tool.trigger.update.loading'),
      success: () => {
        void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
        return t('workspace.flow-view.endpoint.start-tool.trigger.update.success');
      },
      error: t('workspace.flow-view.endpoint.start-tool.trigger.update.error'),
    });
  };

  const handleRemove = () => {
    toast.promise(removeTrigger(), {
      loading: t('workspace.flow-view.endpoint.start-tool.trigger.delete.loading'),
      success: () => {
        void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
        return t('workspace.flow-view.endpoint.start-tool.trigger.delete.success');
      },
      error: t('workspace.flow-view.endpoint.start-tool.trigger.delete.error'),
    });
  };

  const { icon, displayName, description } = (triggerTypes?.find((it) => it.type === type) || {}) as ITriggerType;

  const webhookPath = trigger.webhookPath;

  return (
    <Card className="relative">
      <CardHeader className="relative pl-20">
        <div className="absolute left-0 top-0 flex size-full items-center justify-between px-6">
          <VinesIcon src={icon} size="md" disabledPreview />
          <Switch disabled={!isLatestWorkflowVersion} checked={enabled} onCheckedChange={handleEnableChange} />
        </div>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {webhookPath && (
        <CardContent>
          <p className="text-sm">{t('workspace.flow-view.endpoint.start-tool.trigger.webhook-path-title')}</p>
          <span className="text-xs text-gray-11">{`${new URL(window.location.href).origin}/api/workflow/webhook/${trigger.webhookPath}`}</span>
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className={cn('text-red-10 [&_svg]:stroke-red-10', !isLatestWorkflowVersion && 'hidden')}
              variant="outline"
              icon={<Trash2 />}
              size="small"
            >
              {t('workspace.flow-view.endpoint.start-tool.trigger.delete.button')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('workspace.flow-view.endpoint.start-tool.trigger.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('workspace.flow-view.endpoint.start-tool.trigger.delete.desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('workspace.flow-view.endpoint.start-tool.trigger.delete.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove}>
                {t('workspace.flow-view.endpoint.start-tool.trigger.delete.action')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};
