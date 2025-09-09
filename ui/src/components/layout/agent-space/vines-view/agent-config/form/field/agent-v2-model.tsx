import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';

interface IAgentV2ConfigFormFieldModelProps {
  form: UseFormReturn<IAgentV2Config>;
  availableModels?: string[];
}

export const AgentV2ConfigFormFieldModel: React.FC<IAgentV2ConfigFormFieldModelProps> = ({
  form,
  availableModels = [],
}) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="model"
      control={form.control}
      render={({ field }) => (
        <FormItem className="flex-1" card>
          <FormLabel>大语言模型</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
