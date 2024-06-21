import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateWorkflow } from '@/apis/workflow';
import { IVinesWorkflowRateLimiter } from '@/apis/workflow/typings.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Switch } from '@/components/ui/switch';
import { useVinesFlow } from '@/package/vines-flow';
import { IWorkflowApiConfigInfo, workflowApiConfigInfoSchema } from '@/schema/workspace/workflow-api-config';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IWorkflowApiConfigProps {}

export const WorkflowApiConfig: React.FC<IWorkflowApiConfigProps> = () => {
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { vines } = useVinesFlow();
  const { workflow } = useVinesPage();

  const rateLimiter: IVinesWorkflowRateLimiter | undefined = workflow?.rateLimiter;
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
      openaiModelName: workflow?.openaiModelName,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!workflow?.workflowId) {
      setIsLoading(false);
      toast.error('工作流 ID 不存在');
      return;
    }

    vines.enableOpenAIInterface = data.exposeOpenaiCompatibleInterface;

    toast.promise(
      updateWorkflow(workflowId, workflowVersion, {
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
    <div className="relative flex h-80 w-full flex-col py-2">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col justify-between gap-4">
          <ScrollArea className="h-64">
            <FormField
              name="exposeOpenaiCompatibleInterface"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>启用 OpenAI 兼容的接口</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues().exposeOpenaiCompatibleInterface && (
              <>
                <FormField
                  name="openaiModelName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模型名称</FormLabel>
                      <FormDescription>
                        模型名称默认为工作流 ID，你也可以设置自定义模型名称，在通过 API 调用接口时可以设置 model
                        为此自定义名称（同一个团队内必须唯一）。
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="请输入模型名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              name="rateLimiter.enabled"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>开启限流</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                        <Input placeholder="请输入时间窗口大小（毫秒）" {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </ScrollArea>

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
