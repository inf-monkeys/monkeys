import React from 'react';

import { useCreation } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useLLMModels } from '@/apis/llm';
import { ILLMModel } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/llm-model.tsx';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
          (acc: ILLMModel[], item) =>
            acc.concat(
              Object.entries(item.models)
                .filter(([, model]) => model != 'davinci-002')
                .map(([, model]) => ({
                  displayName: `${item.channelId === 0 ? '' : `${model} - `}${getI18nContent(item.displayName) ?? model}`,
                  description: getI18nContent(item.description),
                  iconUrl: item?.iconUrl ?? '',
                  channelId: item.channelId,
                  model: model,
                  value: item.channelId === 0 ? model : `${item.channelId}:${model}`,
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
                      {modelList.map(({ displayName, value, iconUrl, channelId, description, model }, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <SelectItem value={value}>
                              <div className="flex items-center gap-2">
                                {iconUrl && <img src={iconUrl} alt={displayName} className="size-6" />}
                                <p className="text-sm font-bold">{displayName}</p>
                                {channelId === 0 && (
                                  <p className="text-xxs model-tag rounded border border-input bg-muted p-1">
                                    {t('common.utils.system')}
                                  </p>
                                )}
                              </div>
                            </SelectItem>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-72" side={i === 0 ? 'bottom' : 'top'}>
                            <span className="text-sm font-bold">{model}</span>
                            <br />
                            {description}
                          </TooltipContent>
                        </Tooltip>
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
