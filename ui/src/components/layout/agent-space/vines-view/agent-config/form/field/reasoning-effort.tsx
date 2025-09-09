import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Switch } from '@/components/ui/switch';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';

interface IAgentV2ConfigFormFieldReasoningEffortProps {
  form: UseFormReturn<IAgentV2Config>;
}

export const AgentV2ConfigFormFieldReasoningEffort: React.FC<IAgentV2ConfigFormFieldReasoningEffortProps> = ({
  form,
}) => {
  const reasoningEffortEnabled = form.watch('reasoningEffortEnabled');

  return (
    <div className="space-y-4">
      <FormField
        name="reasoningEffortEnabled"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4" card>
            <div className="space-y-0.5">
              <FormLabel className="text-base">推理努力</FormLabel>
              <FormDescription>启用推理努力可以让模型在回答问题时进行更深入的思考，提高回答质量。</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value || false} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {reasoningEffortEnabled && (
        <FormField
          name="reasoningEffortLevel"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex-1" card>
              <FormLabel>推理努力级别</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择推理努力级别" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex flex-col">
                      <span>低</span>
                      <span className="text-xs text-muted-foreground">快速响应，基础推理</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col">
                      <span>中</span>
                      <span className="text-xs text-muted-foreground">平衡速度和质量</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex flex-col">
                      <span>高</span>
                      <span className="text-xs text-muted-foreground">深度推理，更高质量</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="w-[30rem]">
                选择模型的推理深度。更高的级别会提供更好的回答质量，但可能需要更长时间。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
