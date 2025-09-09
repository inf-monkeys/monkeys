import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';

interface IAgentV2ConfigFormFieldTimeoutProps {
  form: UseFormReturn<IAgentV2Config>;
  constraints?: {
    min: number;
    max: number;
  };
}

export const AgentV2ConfigFormFieldTimeout: React.FC<IAgentV2ConfigFormFieldTimeoutProps> = ({ form, constraints }) => {
  return (
    <FormField
      name="timeout"
      control={form.control}
      render={({ field }) => (
        <FormItem className="flex-1" card>
          <FormLabel>超时时间 (毫秒)</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={`${constraints?.min || 1000} - ${constraints?.max || 300000}`}
              min={constraints?.min || 1000}
              max={constraints?.max || 300000}
              value={field.value || ''}
              onChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
            />
          </FormControl>
          <FormDescription className="w-[30rem]">
            设置智能体响应的超时时间（毫秒）。如果在指定时间内没有收到响应，请求将被取消。
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
