import React, { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateWorkflow } from '@/apis/workflow';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { IWorkflowInfo, workflowInfoSchema } from '@/schema/workspace/workflow-info.ts';

interface IWorkflowInfoEditorProps {
  workflow?: MonkeyWorkflow;
  children?: React.ReactNode;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
}

export const WorkflowInfoEditor: React.FC<IWorkflowInfoEditorProps> = ({
  workflow: propWorkflow,
  children,
  visible,
  setVisible,
  afterUpdate,
}) => {
  const { workflow: vinesPageWorkflow, mutateWorkflow, apikey } = useVinesPage();

  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  useMemo(() => {
    typeof visible != 'undefined' && setOpen(visible);
  }, [visible]);

  useMemo(() => {
    if (typeof setVisible != 'undefined') {
      setTimeout(() => {
        setVisible(open);
      });
    }
  }, [open]);

  const workflow = propWorkflow || vinesPageWorkflow;

  const form = useForm<IWorkflowInfo>({
    resolver: zodResolver(workflowInfoSchema),
    defaultValues: {
      name: workflow?.name ?? '未命名应用',
      description: workflow?.description ?? '',
      iconUrl: workflow?.iconUrl ?? 'emoji:🍀:#ceefc5',
    },
  });

  useEffect(() => {
    if (!workflow) return;
    form.setValue('name', workflow.name || '未命名应用');
    form.setValue('description', workflow.description || '');
    form.setValue('iconUrl', workflow.iconUrl || 'emoji:🍀:#ceefc5');
  }, [workflow]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!workflow?.workflowId) {
      setIsLoading(false);
      toast.error('工作流 ID 不存在');
      return;
    }
    const newWorkflow = await updateWorkflow(apikey, workflow?.workflowId, workflow?.version ?? 1, data);
    if (newWorkflow) {
      afterUpdate ? afterUpdate() : await mutateWorkflow();
      setOpen(false);
      setIsLoading(false);
      toast.success('工作流信息已更新');
    } else {
      toast.error('工作流信息更新失败');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>工作流信息</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工作流名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入工作流名称" {...field} className="grow" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工作流描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入工作流描述，不超过 200 字" className="h-28 resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工作流图标</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} defaultValue={workflow?.iconUrl} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                确定
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
