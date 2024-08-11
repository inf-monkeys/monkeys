import React from 'react';

import { ToolType } from '@inf-monkeys/monkeys';
import { useCreation } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isArray } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useToolLists } from '@/apis/tools';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { MultiSelect } from '@/components/ui/multi-select';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';
import { getI18nContent } from '@/utils';

interface IAgentConfigFormFieldToolsProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldTools: React.FC<IAgentConfigFormFieldToolsProps> = ({ form }) => {
  const { t } = useTranslation();

  const { data: tools, isLoading } = useToolLists();

  const list = useCreation(
    () =>
      tools
        ? tools
            .filter((x) => !x.name.startsWith('llm:') && x.type === ToolType.SIMPLE)
            .map((m) => {
              return { label: getI18nContent(m.displayName) ?? '', value: m.name };
            })
        : [],
    [tools],
  );

  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <motion.div
          key="vines-agent-tools-loading"
          className="flex h-[78px] w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading size="md" />
        </motion.div>
      ) : (
        <motion.div
          key="vines-agent-tools"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <FormField
            name="tools"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t('agent.view-config.form.tools.label')}</FormLabel>
                <FormControl>
                  <MultiSelect
                    className="w-[30rem]"
                    options={list}
                    value={isArray(field.value) ? field.value : []}
                    onValueChange={(vals) => field.onChange(vals)}
                    placeholder={t('agent.view-config.form.tools.placeholder')}
                    maxCount={5}
                  />
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
