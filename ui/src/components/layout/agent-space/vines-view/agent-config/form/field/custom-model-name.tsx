import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';

interface IAgentConfigFormFieldCustomModelNameProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldCustomModelName: React.FC<IAgentConfigFormFieldCustomModelNameProps> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <FormField
      name="customModelName"
      control={form.control}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{t('agent.view-config.form.custom-model-name.label')}</FormLabel>
          <FormControl>
            <Input placeholder={t('agent.view-config.form.custom-model-name.placeholder')} {...field} />
          </FormControl>
          <FormDescription>{t('agent.view-config.form.custom-model-name.desc')}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
