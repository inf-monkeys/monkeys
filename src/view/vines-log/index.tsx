import React, { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { useWorkflowVersions } from '@/apis/workflow/version';
import { VinesLogItem } from '@/components/layout/view/vines-log/item';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import MultipleSelector from '@/components/ui/multiple-selector';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import {
  IVinesSearchWorkflowExecutionsParams,
  vinesSearchWorkflowExecutionsSchema,
} from '@/schema/workspace/workflow-execution.ts';

export const VinesLogView: React.FC = () => {
  const { vines } = useVinesFlow();

  const { data: searchWorkflowExecutionsData, trigger } = useSearchWorkflowExecutions();

  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;
  const { data: workflowMultiVersionData } = useWorkflowVersions(vines.workflowId ?? '');
  const workflowVersions = (workflowMultiVersionData ?? []).map((flow) => flow.version);
  const workflowVersionOptions = workflowVersions.map((ver) => {
    return {
      label: ver === -1 ? '临时' : ver.toString(),
      value: ver.toString(),
    };
  });

  console.log(workflowMultiVersionData, workflowVersions);

  const workflowDefinitionIdMapper = useMemo(() => {
    return _.keyBy(workflowDefinitions, 'workflowId');
  }, [workflowDefinitions]);

  const form = useForm<IVinesSearchWorkflowExecutionsParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionsSchema),
  });

  useEffect(() => {
    if (vines.workflowId) {
      form.setValue('workflowId', vines.workflowId);
      void handleSubmit();
    }
  }, [vines.workflowId]);

  const handleSubmit = form.handleSubmit((params) => {
    console.log(params);
    toast.promise(trigger(params), {
      loading: '查询中...',
      error: '查询失败，请检查网络是否通畅',
      // finally: () => setIsLoggingIn(false),
    });
  });

  return (
    <main className="flex gap-4 p-10">
      <div className="flex w-[250px] flex-col gap-4 px-2">
        <span className="text-lg font-bold">{vines.workflowName}</span>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <FormField
              control={form.control}
              name="versions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>版本号</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      value={(field.value ?? []).map((ver) => {
                        return {
                          label: ver === -1 ? '临时' : ver.toString(),
                          value: ver.toString(),
                        };
                      })}
                      onChange={(options) => {
                        field.onChange(options.map((option) => parseInt(option.value)));
                      }}
                      defaultOptions={workflowVersionOptions}
                      placeholder="请选择版本号"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">没有结果了</p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="workflowInstanceId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>执行 ID</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入应用执行 ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" variant="solid">
              查询
            </Button>
          </form>
        </Form>
      </div>
      <div className="flex-1">
        <ScrollArea className="h-[calc(100vh-3.5rem-0.5rem-0.25rem-1rem-2rem-5rem)]">
          <div className="flex flex-col gap-3">
            {workflowExecutions &&
              workflowDefinitions &&
              workflowExecutions.map((workflowExecution, index) => (
                <VinesLogItem
                  key={index}
                  workflowExecution={workflowExecution}
                  workflowDefinition={workflowDefinitionIdMapper[workflowExecution.workflowName!]}
                />
              ))}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
};
