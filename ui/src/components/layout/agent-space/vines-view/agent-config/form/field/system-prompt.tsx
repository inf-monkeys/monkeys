import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';

interface IAgentConfigFormFieldSystemPromptProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldSystemPrompt: React.FC<IAgentConfigFormFieldSystemPromptProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="systemPrompt"
      control={form.control}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{t('agent.view-config.form.system-prompt.label')}</FormLabel>
          <FormControl>
            <Textarea placeholder={t('agent.view-config.form.system-prompt.placeholder')} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
