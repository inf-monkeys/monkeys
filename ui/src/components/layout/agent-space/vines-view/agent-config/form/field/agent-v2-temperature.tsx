import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';

interface IAgentV2ConfigFormFieldTemperatureProps {
  form: UseFormReturn<IAgentV2Config>;
  constraints?: {
    min: number;
    max: number;
  };
}

export const AgentV2ConfigFormFieldTemperature: React.FC<IAgentV2ConfigFormFieldTemperatureProps> = ({
  form,
  constraints,
}) => {
  const { t } = useTranslation();

  const min = constraints?.min || 0;
  const max = constraints?.max || 2;

  return (
    <FormField
      name="temperature"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem className="flex-1" card>
          <FormLabel>温度</FormLabel>
          <FormControl>
            <Slider
              min={min}
              max={max}
              step={0.1}
              defaultValue={[Number(value) || 0.7]}
              value={[Number(value) || 0.7]}
              onValueChange={(v) => field.onChange(v[0])}
              {...field}
            />
          </FormControl>
          <FormDescription className="w-[30rem]">
            温度值越高，模型回答越具有创造性和随机性；温度值越低，模型回答越确定和一致。
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
