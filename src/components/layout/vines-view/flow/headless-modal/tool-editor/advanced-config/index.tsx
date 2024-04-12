import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { NumberInput } from '@mantine/core';
import { useForm } from 'react-hook-form';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { IToolsAdvancedConfig, toolsAdvancedConfigSchema } from '@/schema/tools/tools-advanced-config';

interface INodeConfigProps {
  nodeId: string;
  task?: VinesTask;
}

export const ToolAdvancedConfig: React.FC<INodeConfigProps> = ({ nodeId, task }) => {
  const { vines } = useVinesFlow();

  const toolName = task?.name ?? '';

  const tool = vines.getTool(toolName);
  const form = useForm<IToolsAdvancedConfig>({
    resolver: zodResolver(toolsAdvancedConfigSchema),
    defaultValues: {
      outputAs: 'json',
      timeout: 3600,
    },
  });

  return (
    <main className="flex size-full overflow-clip">
      <Form {...form}>
        <form className="flex flex-col gap-2">
          <FormField
            name="outputAs"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>输出模式</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择一个输出模式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['json', 'stream'].map((it) => (
                        <SelectItem value={it} key={it}>
                          {it}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="timeout"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>超时时间（秒）</FormLabel>
                <FormControl>
                  <NumberInput placeholder="超时时间（秒）" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </main>
  );
};
