import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';

interface IAgentV2ConfigFormFieldMaxTokensProps {
  form: UseFormReturn<IAgentV2Config>;
  constraints?: {
    min: number;
    max: number;
  };
}

export const AgentV2ConfigFormFieldMaxTokens: React.FC<IAgentV2ConfigFormFieldMaxTokensProps> = ({
  form,
  constraints,
}) => {
  return (
    <FormField
      name="maxTokens"
      control={form.control}
      render={({ field }) => (
        <FormItem className="flex-1" card>
          <FormLabel>最大Token数</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={`${constraints?.min || 1} - ${constraints?.max || 100000}`}
              min={constraints?.min || 1}
              max={constraints?.max || 100000}
              value={field.value || ''}
              onChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
            />
          </FormControl>
          <FormDescription className="w-[30rem]">
            设置模型生成的最大token数量。较高的值允许更长的回复，但会消耗更多资源。
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
