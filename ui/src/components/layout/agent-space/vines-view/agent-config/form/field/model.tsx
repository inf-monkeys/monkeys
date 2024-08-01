import React from 'react';

import { useCreation } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLLMModels } from '@/apis/llm';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';
import { getI18nContent } from '@/utils';

interface IAgentConfigFormFieldModelProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldModel: React.FC<IAgentConfigFormFieldModelProps> = ({ form }) => {
  const { t, i18n } = useTranslation();

  const { data, isLoading } = useLLMModels();

  const modelList = useCreation(() => {
    return data
      ? data.reduce(
          (acc: { name: string; value: string }[], item) =>
            acc.concat(
              Object.entries(item.models).map(([key, value]) => ({
                name: `${getI18nContent(item.displayName)} - ${value}`,
                value: key,
              })),
            ),
          [],
        )
      : [];
  }, [data, i18n.language]);

  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <motion.div
          key="vines-agent-model-loading"
          className="flex h-[76px] w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading size="md" />
        </motion.div>
      ) : (
        <motion.div
          key="vines-agent-model"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <FormField
            name="model"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('agent.view-config.form.model.label')}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('ugc-page.app.create.dialog.model.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelList.map(({ name, value }, i) => (
                        <SelectItem value={value} key={i}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
