import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCreation } from 'ahooks';
import { ChevronRightIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createAgentV2, useAvailableModelsV2 } from '@/apis/agents-v2';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { I18nInput } from '@/components/ui/i18n-input';
import { I18nTextarea } from '@/components/ui/i18n-textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_AGENT_ICON_URL } from '@/consts/icons.ts';
import i18n from '@/i18n.ts';
import { createAgentSchema, ICreateAgentInfo } from '@/schema/workspace/create-agent.ts';
import { getI18nContent } from '@/utils';

export const AgentCreateForm: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOpen }) => {
  const { t } = useTranslation();

  const { data: availableModelsData, isLoading: isModelsLoading } = useAvailableModelsV2();

  // Get defaults and constraints from API response
  const modelDefaults = availableModelsData?.success
    ? availableModelsData.data.defaults
    : (availableModelsData as any)?.defaults || null;
  const modelConstraints = availableModelsData?.success
    ? availableModelsData.data.constraints
    : (availableModelsData as any)?.constraints || null;

  const form = useForm<ICreateAgentInfo>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      displayName: t('common.utils.untitled') + t('common.type.agent'),
      description: '',
      iconUrl: DEFAULT_AGENT_ICON_URL,
      temperature: modelDefaults?.temperature || 0.7,
      maxTokens: modelDefaults?.maxTokens || 4096,
      timeout: modelDefaults?.timeout || 30000,
      reasoningEffort: {
        enabled: false,
        level: 'medium',
      },
    },
  });

  const modelList = useCreation(() => {
    if (!availableModelsData) return [];

    // Handle both wrapped and direct API response formats
    let models: string[];
    if (availableModelsData?.success && availableModelsData.data?.models) {
      // Wrapped format: {success: true, data: {models: []}}
      models = availableModelsData.data.models;
    } else if (availableModelsData?.data?.models) {
      // Direct format with data wrapper: {data: {models: []}}
      models = availableModelsData.data.models;
    } else if ((availableModelsData as any)?.models) {
      // Direct format: {models: []}
      models = (availableModelsData as any).models;
    } else {
      models = [];
    }

    return models.map((model) => ({
      displayName: model,
      description: 'Agent V2 Model',
      iconUrl: '',
      channelId: 0,
      model: model,
      value: model,
    }));
  }, [availableModelsData, i18n.language]);

  const mutateAgents = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/conversation-app'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);

    // Transform form data to Agent V2 format
    const agentV2Data = {
      name: typeof data.displayName === 'string' ? data.displayName : getI18nContent(data.displayName) || '',
      description: typeof data.description === 'string' ? data.description : getI18nContent(data.description) || '',
      iconUrl: data.iconUrl || '',
      config: {
        model: data.model,
        temperature: data.temperature || 0.7,
        maxTokens: data.maxTokens || 4096,
        timeout: data.timeout || 30000,
        reasoningEffort: data.reasoningEffort || {
          enabled: false,
          level: 'medium' as const,
        },
      },
    };

    toast.promise(createAgentV2(agentV2Data), {
      success: (agent) => {
        if (agent) {
          window.open(`/${teamId}/agent/${agent.id}`, '_blank');
          setOpen(false);
          return t('common.create.success');
        } else {
          return t('common.create.error');
        }
      },
      loading: t('common.create.loading'),
      error: t('common.create.error'),
      finally: () => {
        setIsCreating(false);
        void mutateAgents();
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-global">
        <div className="flex flex-col gap-2">
          <FormLabel>{t('ugc-page.app.create.dialog.info.label')}</FormLabel>

          <div className="flex w-full items-center gap-3">
            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VinesIconEditor value={field.value ?? ''} onChange={field.onChange} size="md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <I18nInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('ugc-page.app.create.dialog.info.placeholder')}
                      autoFocus
                      dialogTitle={t('ugc-page.app.create.dialog.info.label')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ugc-page.app.create.dialog.description.label')}</FormLabel>
              <FormControl>
                <I18nTextarea
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('ugc-page.app.create.dialog.description.placeholder')}
                  className="h-16 resize-none"
                  dialogTitle={t('ugc-page.app.create.dialog.description.label')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="model"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ugc-page.app.create.dialog.model.label')}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ugc-page.app.create.dialog.model.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isModelsLoading ? (
                      <SelectItem value="loading" disabled>
                        加载模型中...
                      </SelectItem>
                    ) : modelList.length === 0 ? (
                      <SelectItem value="no-models" disabled>
                        暂无可用模型
                      </SelectItem>
                    ) : (
                      modelList.map(({ displayName, value, iconUrl, channelId, description, model }, i) => (
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
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
              {t('ugc-page.app.create.dialog.options-label')}
              <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-1 pt-global">
              <div className="space-y-6">
                {/* 数值配置三列布局 */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    name="temperature"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min={modelConstraints?.temperature?.min || 0}
                            max={modelConstraints?.temperature?.max || 2}
                            placeholder={modelDefaults?.temperature?.toString() || '0.7'}
                            value={field.value || ''}
                            onChange={(value: string) =>
                              field.onChange(parseFloat(value) || modelDefaults?.temperature || 0.7)
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          随机性 ({modelConstraints?.temperature?.min || 0}-{modelConstraints?.temperature?.max || 2})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="maxTokens"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>最大Token数</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={modelConstraints?.maxTokens?.min || 1}
                            max={modelConstraints?.maxTokens?.max || 100000}
                            placeholder={modelDefaults?.maxTokens?.toString() || '4096'}
                            value={field.value || ''}
                            onChange={(value: string) =>
                              field.onChange(parseInt(value) || modelDefaults?.maxTokens || 4096)
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          输出长度 ({modelConstraints?.maxTokens?.min || 1}-{modelConstraints?.maxTokens?.max || 100000}
                          )
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="timeout"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>超时时间(ms)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={modelConstraints?.timeout?.min || 1000}
                            max={modelConstraints?.timeout?.max || 300000}
                            placeholder={modelDefaults?.timeout?.toString() || '30000'}
                            value={field.value || ''}
                            onChange={(value: string) =>
                              field.onChange(parseInt(value) || modelDefaults?.timeout || 30000)
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          超时 ({modelConstraints?.timeout?.min || 1000}-{modelConstraints?.timeout?.max || 300000})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 推理增强配置 */}
                <div className="grid grid-cols-2 items-start gap-4">
                  <FormField
                    name="reasoningEffort.enabled"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>启用推理增强</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs">仅部分模型支持</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch('reasoningEffort.enabled') ? (
                    <FormField
                      name="reasoningEffort.level"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>推理强度级别</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="选择推理强度" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">低 - 基础推理能力</SelectItem>
                                <SelectItem value="medium">中 - 平衡推理与速度</SelectItem>
                                <SelectItem value="high">高 - 最强推理能力</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription className="text-xs">推理强度越高，思考越深入但速度较慢</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      启用推理增强后可选择强度级别
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
          >
            {t('common.utils.cancel')}
          </Button>
          <Button variant="solid" type="submit" loading={isCreating} disabled={isModelsLoading}>
            {t('common.utils.create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
