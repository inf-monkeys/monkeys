import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCreation } from 'ahooks';
import { ChevronRightIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createAgent } from '@/apis/agents';
import { useLLMModels } from '@/apis/llm';
import { ILLMModel } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/llm-model.tsx';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import i18n from '@/i18n.ts';
import { createAgentSchema, ICreateAgentInfo } from '@/schema/workspace/create-agent.ts';
import { getI18nContent } from '@/utils';

export const AgentCreateForm: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOpen }) => {
  const { t } = useTranslation();

  const form = useForm<ICreateAgentInfo>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      displayName: t('common.utils.untitled') + t('common.type.agent'),
      description: '',
      iconUrl: 'emoji:🤖:#ceefc5',
    },
  });

  const { isLoading: isLLMModelsLoading, data: llmModelsData } = useLLMModels();

  const modelList = useCreation(() => {
    return llmModelsData
      ? llmModelsData.reduce(
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
  }, [llmModelsData, i18n.language]);

  const mutateAgents = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/conversation-app'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);

    toast.promise(createAgent(data), {
      success: (agent) => {
        if (agent) {
          open(`/${teamId}/agent/${agent.id}`, '_blank');
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
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
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
                    <Input
                      placeholder={t('ugc-page.app.create.dialog.info.placeholder')}
                      {...field}
                      className=""
                      autoFocus
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
                <Textarea
                  placeholder={t('ugc-page.app.create.dialog.description.placeholder')}
                  className="h-16 resize-none"
                  {...field}
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
              {t('ugc-page.app.create.dialog.options-label')}
              <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-1 pt-4">
              <FormField
                name="customModelName"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('ugc-page.app.create.dialog.customModelName.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.app.create.dialog.customModelName.placeholder')}
                        {...field}
                        className=""
                      />
                    </FormControl>
                    <FormDescription>{t('ugc-page.app.create.dialog.customModelName.description')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          <Button variant="solid" type="submit" loading={isCreating} disabled={isLLMModelsLoading}>
            {t('common.utils.create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
