import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRightIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateAgentV2Config, useAgentV2Config, useAvailableModelsV2, useGetAgentV2 } from '@/apis/agents-v2';
import { AgentV2ConfigFormFieldModel } from '@/components/layout/agent-space/vines-view/agent-config/form/field/agent-v2-model.tsx';
import { AgentV2ConfigFormFieldTemperature } from '@/components/layout/agent-space/vines-view/agent-config/form/field/agent-v2-temperature.tsx';
import { AgentV2ConfigFormFieldTools } from '@/components/layout/agent-space/vines-view/agent-config/form/field/agent-v2-tools.tsx';
import { AgentV2ConfigFormFieldMaxTokens } from '@/components/layout/agent-space/vines-view/agent-config/form/field/max-tokens.tsx';
import { AgentV2ConfigFormFieldReasoningEffort } from '@/components/layout/agent-space/vines-view/agent-config/form/field/reasoning-effort.tsx';
import { AgentV2ConfigFormFieldTimeout } from '@/components/layout/agent-space/vines-view/agent-config/form/field/timeout.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Form } from '@/components/ui/form.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import {
  agentV2ConfigSchema,
  IAgentV2Config,
  transformFromApiConfig,
  transformToApiConfig,
} from '@/schema/agent-v2/agent-v2-config.ts';
import { useAgentStore } from '@/store/useAgentStore';
import { usePageStore } from '@/store/usePageStore';

const AgentV2ConfigView: React.FC = () => {
  const agentId = useAgentStore((s) => s.agentId);
  const { data: agentData } = useGetAgentV2(agentId);
  const { data: configData, mutate: mutateConfig } = useAgentV2Config(agentId);
  const { data: modelsData } = useAvailableModelsV2();

  const form = useForm<IAgentV2Config>({
    resolver: zodResolver(agentV2ConfigSchema),
  });

  const forceUpdate = useForceUpdate();

  // Load initial form data
  useEffect(() => {
    // Handle both wrapped and unwrapped config data formats
    const actualConfigData = (configData as any)?.data || configData;
    if (!actualConfigData) {
      return;
    }

    const formData = transformFromApiConfig(actualConfigData);

    // Set form values
    if (formData.model) form.setValue('model', formData.model);
    if (formData.temperature !== undefined) form.setValue('temperature', formData.temperature);
    if (formData.maxTokens) form.setValue('maxTokens', formData.maxTokens);
    if (formData.timeout) form.setValue('timeout', formData.timeout);
    if (formData.reasoningEffortEnabled !== undefined)
      form.setValue('reasoningEffortEnabled', formData.reasoningEffortEnabled);
    if (formData.reasoningEffortLevel) form.setValue('reasoningEffortLevel', formData.reasoningEffortLevel);

    // Also set basic info from agent data
    if (agentData) {
      const displayName =
        typeof agentData.name === 'string'
          ? agentData.name
          : (typeof agentData.name === 'object' && agentData.name
              ? (Object.values(agentData.name)[0] as string)
              : '') || '';
      form.setValue('displayName', displayName);
      form.setValue('description', typeof agentData.description === 'string' ? agentData.description : '');
      form.setValue('iconUrl', agentData.iconUrl || '');
    }

    forceUpdate();
  }, [configData, agentData, form, forceUpdate]);

  // Set default values from modelsData if no config data is available
  useEffect(() => {
    const actualConfigData = (configData as any)?.data || configData;
    const actualModelsData = modelsData?.data || modelsData;
    if (actualModelsData && !actualConfigData) {
      const defaults = (actualModelsData as any).defaults;
      const models = (actualModelsData as any).models;

      // Set default values
      if (models?.length > 0 && !form.getValues('model')) {
        form.setValue('model', models[0]);
      }
      if (defaults?.temperature !== undefined && !form.getValues('temperature')) {
        form.setValue('temperature', defaults.temperature);
      }
      if (defaults?.maxTokens !== undefined && !form.getValues('maxTokens')) {
        form.setValue('maxTokens', defaults.maxTokens);
      }
      if (defaults?.timeout !== undefined && !form.getValues('timeout')) {
        form.setValue('timeout', defaults.timeout);
      }

      forceUpdate();
    }
  }, [modelsData, configData, form, forceUpdate]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!agentId) {
      toast.error('智能体ID不能为空');
      return;
    }

    setLoading(true);

    try {
      const apiConfig = transformToApiConfig(data);
      const result = await updateAgentV2Config(agentId, apiConfig);

      console.log('Update result:', result);

      // Handle both wrapped and unwrapped response formats
      const success = result?.success || (result && typeof result === 'object' && !result.error);

      if (success) {
        toast.success('智能体配置已更新');
        await mutateConfig();
      } else {
        toast.error(`更新失败: ${result?.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to update agent config:', error);
      toast.error('更新配置失败');
    }

    setLoading(false);
  });

  const containerHeight = usePageStore((s) => s.containerHeight);

  // Ensure models data is available before passing to components
  // Handle both wrapped and unwrapped data formats
  const availableModels = modelsData?.data?.models || (modelsData as any)?.models || [];

  return (
    <div className="vines-center size-full">
      <Card>
        <CardHeader>
          <CardTitle>Agent V2 配置</CardTitle>
          <CardDescription>配置您的智能体参数和行为</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <CardContent style={{ height: containerHeight - containerHeight * 0.3 }}>
              <ScrollArea
                className="-ml-1 -mr-3.5 h-full pr-3 [&>[data-radix-scroll-area-viewport]>div]:px-1"
                disabledOverflowMask
              >
                <div className="flex flex-col gap-2">
                  {/* Basic Configuration */}
                  <AgentV2ConfigFormFieldModel form={form} availableModels={availableModels} />

                  <AgentV2ConfigFormFieldTemperature
                    form={form}
                    constraints={
                      modelsData?.data?.constraints?.temperature || (modelsData as any)?.constraints?.temperature
                    }
                  />

                  <AgentV2ConfigFormFieldMaxTokens
                    form={form}
                    constraints={
                      modelsData?.data?.constraints?.maxTokens || (modelsData as any)?.constraints?.maxTokens
                    }
                  />

                  <AgentV2ConfigFormFieldTimeout
                    form={form}
                    constraints={modelsData?.data?.constraints?.timeout || (modelsData as any)?.constraints?.timeout}
                  />

                  {/* Tools Configuration */}
                  <AgentV2ConfigFormFieldTools form={form} agentId={agentId} />

                  {/* Advanced Configuration */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="reasoning-effort">
                      <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
                        高级配置
                        <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pt-global">
                        <AgentV2ConfigFormFieldReasoningEffort form={form} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="small" loading={loading} type="submit">
                保存配置
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default AgentV2ConfigView;
