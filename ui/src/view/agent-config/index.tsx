import React, { useEffect, useState } from 'react';

import { useParams } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { I18nValue } from '@inf-monkeys/monkeys';
import { isArray, isNull, isObject, isUndefined, pick } from 'lodash';
import { ChevronRightIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateAgent, useGetAgent } from '@/apis/agents';
import { IAgent } from '@/apis/agents/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AgentConfigFormFieldCustomModelName } from '@/components/layout/agent-space/vines-view/agent-config/form/field/custom-model-name.tsx';
import { AgentConfigFormFieldFrequencyPenalty } from '@/components/layout/agent-space/vines-view/agent-config/form/field/frequency-penalty.tsx';
import { AgentConfigFormFieldKnowledgeBase } from '@/components/layout/agent-space/vines-view/agent-config/form/field/knowledge-base.tsx';
import { AgentConfigFormFieldModel } from '@/components/layout/agent-space/vines-view/agent-config/form/field/model.tsx';
import { AgentConfigFormFieldPresencePenalty } from '@/components/layout/agent-space/vines-view/agent-config/form/field/presence-penalty.tsx';
import { AgentConfigFormFieldSqlKnowledgeBase } from '@/components/layout/agent-space/vines-view/agent-config/form/field/sql-knowledge-base.tsx';
import { AgentConfigFormFieldSystemPrompt } from '@/components/layout/agent-space/vines-view/agent-config/form/field/system-prompt.tsx';
import { AgentConfigFormFieldTemperature } from '@/components/layout/agent-space/vines-view/agent-config/form/field/temperature.tsx';
import { AgentConfigFormFieldTools } from '@/components/layout/agent-space/vines-view/agent-config/form/field/tools.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Form } from '@/components/ui/form.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { agentConfigSchema, IAgentConfig } from '@/schema/agent/agent-config.ts';
import { usePageStore } from '@/store/usePageStore';
import { getI18nContent } from '@/utils';

export const AgentConfigView: React.FC = () => {
  const { t } = useTranslation();

  const { agentId } = useParams({ from: '/$teamId/agent/$agentId/' });
  const { data: agentData } = useGetAgent(agentId);

  const form = useForm<IAgentConfig>({
    resolver: zodResolver(agentConfigSchema),
  });

  const forceUpdate = useForceUpdate();
  useEffect(() => {
    if (!agentData) return;
    for (const [key, value] of Object.entries(pick(agentData, Object.keys(agentConfigSchema.shape)))) {
      if (isUndefined(value) || isNull(value)) continue;
      form.setValue(
        key as keyof IAgentConfig,
        isObject(value)
          ? isArray(value)
            ? (value as string[])
            : getI18nContent(value as I18nValue) ?? ''
          : (value as string),
      );
    }
    forceUpdate();
  }, [agentData]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);

    data.frequency_penalty = Number(data.frequency_penalty);
    data.presence_penalty = Number(data.presence_penalty);
    data.temperature = Number(data.temperature);

    const newAgent = await updateAgent(agentId, data as Partial<IAssetItem<IAgent>>);
    if (newAgent) {
      toast.success(t('agent.info.agent-updated'));
    } else {
      toast.error(t('agent.info.agent-update-failed'));
    }

    setLoading(false);
  });

  const containerHeight = usePageStore((s) => s.containerHeight);

  return (
    <div className="vines-center size-full">
      <Card>
        <CardHeader>
          <CardTitle>{t('agent.view-config.form.label')}</CardTitle>
          <CardDescription>{t('agent.view-config.form.desc')}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <CardContent style={{ height: containerHeight - containerHeight * 0.3 }}>
              <ScrollArea className="-ml-1 -mr-3.5 h-full pr-3 [&>[data-radix-scroll-area-viewport]>div]:px-1">
                <div className="flex flex-col gap-2">
                  <AgentConfigFormFieldModel form={form} />

                  <AgentConfigFormFieldSystemPrompt form={form} />

                  <AgentConfigFormFieldTemperature form={form} />
                  <AgentConfigFormFieldPresencePenalty form={form} />
                  <AgentConfigFormFieldFrequencyPenalty form={form} />

                  <AgentConfigFormFieldTools form={form} />

                  <AgentConfigFormFieldKnowledgeBase form={form} />
                  <AgentConfigFormFieldSqlKnowledgeBase form={form} />

                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
                        {t('agent.view-config.form.advanced-configuration')}
                        <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pt-4">
                        <AgentConfigFormFieldCustomModelName form={form} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="small" loading={loading}>
                {t('agent.view-config.form.submit')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};
