import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { useMemoizedFn } from 'ahooks';
import { isArray, isString, omit } from 'lodash';
import { Copy, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution } from '@/apis/workflow/execution';
import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
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
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

interface IVirtuaExecutionResultRawDataDialogProps {
  children: React.ReactNode;

  data: IVinesExecutionResultItem;
}

export const VirtuaExecutionResultRawDataDialog: React.FC<IVirtuaExecutionResultRawDataDialogProps> = ({
  children,
  data,
}) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const alt = data.render?.alt;

  const [open, setOpen] = useState(false);

  const handleDelete = useMemoizedFn(() => {
    const targetInstanceId = data?.instanceId;
    if (targetInstanceId) {
      toast.promise(deleteWorkflowExecution(targetInstanceId), {
        success: () => {
          setOpen(false);
          void mutate(
            (it) => isString(it) && it.startsWith(`/api/workflow/executions/${data.workflowId}/outputs`),
            (data: any) => {
              return isArray(data) ? data.filter((it) => it?.instanceId !== targetInstanceId) : data;
            },
          );
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    }
  });

  const { copy } = useCopy();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{children}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('workspace.pre-view.actuator.detail.form-render.tips')}</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-[30rem] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('workspace.pre-view.actuator.detail.form-render.title')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">{t('workspace.pre-view.actuator.detail.form-render.tabs.data')}</TabsTrigger>
            <TabsTrigger value="logs">{t('workspace.pre-view.actuator.detail.form-render.tabs.logs')}</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <VinesAbstractDataPreview className="h-96" data={data.render.data} />
            {alt && (
              <Textarea
                className="rounded border p-2 text-sm"
                value={isString(alt) ? alt : JSON.stringify(alt, null, 2)}
                readOnly
              />
            )}
          </TabsContent>
          <TabsContent value="logs">
            <CodeEditor className="h-96 w-full" readonly data={omit(data, 'render') as JSONValue} />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="text-red-10 [&>div>svg]:stroke-red-10" variant="outline" icon={<Trash2 size={16} />}>
                {t('common.utils.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.dialog.delete-confirm.title', { type: '' })}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('common.dialog.delete-confirm.content', {
                    type: '',
                    name: t('workspace.pre-view.actuator.detail.form-render.title'),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.utils.confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            onClick={() => {
              copy(
                JSON.stringify({
                  type: 'input-parameters',
                  data: data.input ?? [],
                }),
              );
            }}
            icon={<Copy size={16} />}
          >
            {t('workspace.pre-view.actuator.detail.form-render.actions.copy-input')}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.utils.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
