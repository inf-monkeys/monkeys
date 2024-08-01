import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';

interface IAgentConfigFormFieldTemperatureProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldTemperature: React.FC<IAgentConfigFormFieldTemperatureProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="temperature"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem className="flex-1">
          <FormLabel>{t('agent.view-config.form.temperature.label')}</FormLabel>
          <FormControl>
            <Slider
              min={0}
              max={1}
              step={0.1}
              defaultValue={[Number(value) || 0]}
              value={[Number(value) || 0]}
              onValueChange={(v) => field.onChange(v[0])}
              {...field}
            />
          </FormControl>
          <FormDescription className="w-[30rem]">{t('agent.view-config.form.temperature.desc')}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
