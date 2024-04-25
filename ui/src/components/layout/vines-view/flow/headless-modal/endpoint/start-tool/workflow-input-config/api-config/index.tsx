import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, NumberInput } from '@mantine/core';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateWorkflow, WorkflowRateLimiter } from '@/apis/workflow';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useVinesFlow } from '@/package/vines-flow';
import { IWorkflowApiConfigInfo, workflowApiConfigInfoSchema } from '@/schema/workspace/workflow-api-config';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import { MonkeyWorkflow } from '@inf-monkeys/vines';

interface IWorkflowApiConfigProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowApiConfig: React.FC<IWorkflowApiConfigProps> = ({ className }) => {
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { vines } = useVinesFlow();
  const { workflow, apikey } = useVinesPage();

  const rateLimiter: WorkflowRateLimiter | undefined = workflow?.rateLimiter;
  const exposeOpenaiCompatibleInterface = workflow?.exposeOpenaiCompatibleInterface;
  const [isLoading, setIsLoading] = useState(false);

  const workflowVersion = vines.version;

  const form = useForm<IWorkflowApiConfigInfo>({
    resolver: zodResolver(workflowApiConfigInfoSchema),
    defaultValues: {
      rateLimiter: {
        enabled: rateLimiter?.enabled ?? false,
        max: rateLimiter?.max ?? 10,
        windowMs: rateLimiter?.windowMs ?? 1000,
      },
      exposeOpenaiCompatibleInterface,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!workflow?.workflowId) {
      setIsLoading(false);
      toast.error('工作流 ID 不存在');
      return;
    }

    toast.promise(
      updateWorkflow(apikey, workflowId, workflowVersion, {
        version: workflowVersion,
        ...data,
      } as Partial<MonkeyWorkflow>),
      {
        success: '操作成功',
        loading: '操作中......',
        error: '操作失败，请检查网络后重试',
        finally: () => {
          setIsLoading(false);
        },
      },
    );
  });

  return (
    <div className={cn('relative flex h-80 w-full flex-col', className)}>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FormField
            name="exposeOpenaiCompatibleInterface"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>启用 OpenAI 兼容的接口</FormLabel>
                <FormControl>
                  <Checkbox className="h-10 resize-none" {...field} checked={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="rateLimiter.enabled"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>开启限流</FormLabel>
                <FormControl>
                  <Checkbox className="h-10 resize-none" {...field} checked={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.getValues().rateLimiter?.enabled && (
            <>
              <FormField
                name="rateLimiter.windowMs"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>时间窗口大小（毫秒）</FormLabel>
                    <FormControl>
                      <NumberInput placeholder="请输入时间窗口大小（毫秒）" className="h-10 resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="rateLimiter.max"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>单位时间窗口内运行最大并发</FormLabel>
                    <FormControl>
                      <NumberInput value={field.value} defaultValue={workflow?.iconUrl} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Button
            loading={isLoading}
            className={cn(!isLatestWorkflowVersion && 'hidden')}
            variant="outline"
            icon={<Save />}
            type="submit"
          >
            保存 API 配置
          </Button>
        </form>
      </Form>
    </div>
  );
};
