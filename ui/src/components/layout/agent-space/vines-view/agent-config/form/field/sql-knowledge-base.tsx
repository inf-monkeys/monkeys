import React from 'react';

import { useCreation } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUgcTableData } from '@/apis/ugc';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IAgentConfig } from '@/schema/agent/agent-config.ts';
import { getI18nContent } from '@/utils';

interface IAgentConfigFormFieldSqlKnowledgeBaseProps {
  form: UseFormReturn<IAgentConfig>;
}

export const AgentConfigFormFieldSqlKnowledgeBase: React.FC<IAgentConfigFormFieldSqlKnowledgeBaseProps> = ({
  form,
}) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data, isLoading } = useUgcTableData({
    page: 1,
    limit: 99999,
    filter: {},
  });

  const list = useCreation(
    () =>
      data
        ? data.data.map((m) => {
            const ownedByTeam = teamId === m.teamId;
            const displayName = ownedByTeam
              ? getI18nContent(m.displayName)
              : t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sql-knowledge-base.display-name', {
                  name: getI18nContent(m.displayName),
                });
            return { name: displayName!, value: m.uuid };
          })
        : [],
    [data, teamId],
  );

  const isEmptyList = list.length === 0;

  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <motion.div
          key="vines-agent-knowledgeBase-loading"
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
          key="vines-agent-knowledgeBase"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <FormField
            name="sqlKnowledgeBase"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t('agent.view-config.form.sql-knowledge-base.label')}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('agent.view-config.form.sql-knowledge-base.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {list.map(({ name, value }, i) => (
                        <SelectItem value={value} key={i}>
                          {name}
                        </SelectItem>
                      ))}
                      {isEmptyList && (
                        <SelectItem disabled value="empty">
                          {t('agent.view-config.form.sql-knowledge-base.empty')}
                        </SelectItem>
                      )}
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
