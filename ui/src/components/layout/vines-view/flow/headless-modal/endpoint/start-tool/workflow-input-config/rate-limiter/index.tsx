import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, NumberInput } from '@mantine/core';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateWorkflowRateLimiter, WorkflowRateLimiter } from '@/apis/workflow';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IWorkflowRateLimiterInfo,
  workflowRateLimiterInfoSchema,
} from '@/schema/workspace/workflow-rate-limiter-config';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IWorkflowRateLimiterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowRateLimiterConfig: React.FC<IWorkflowRateLimiterProps> = ({ className }) => {
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { vines } = useVinesFlow();
  const { workflow, apikey } = useVinesPage();

  // @ts-ignore
  const rateLimiter: WorkflowRateLimiter = workflow.rateLimiter;
  const [isLoading, setIsLoading] = useState(false);

  const workflowVersion = vines.version;

  const form = useForm<IWorkflowRateLimiterInfo>({
    resolver: zodResolver(workflowRateLimiterInfoSchema),
    defaultValues: {
      enabled: rateLimiter?.enabled ?? false,
      max: rateLimiter?.max ?? 10,
      windowMs: rateLimiter?.windowMs ?? 1000,
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
      updateWorkflowRateLimiter(apikey, workflowId, workflowVersion, {
        version: workflowVersion,
        ...data,
      }),
      {
        success: data.enabled ? '已开启' : '已关闭',
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
            name="enabled"
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

          {form.getValues().enabled && (
            <>
              <FormField
                name="windowMs"
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
                name="max"
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
            保存限流配置
          </Button>
        </form>
      </Form>
    </div>
  );
};
