import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateAgent, useGetAgent } from '@/apis/agents';
import { IAgent } from '@/apis/agents/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { I18nInput } from '@/components/ui/i18n-input';
import { I18nTextarea } from '@/components/ui/i18n-textarea';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_AGENT_ICON_URL } from '@/consts/icons.ts';
import { agentInfoSchema, IAgentInfo } from '@/schema/agent/agent-info.ts';

interface IAgentInfoEditorProps {
  children?: React.ReactNode;
  agent?: IAssetItem<IAgent>;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
}

export const AgentInfoEditor: React.FC<IAgentInfoEditorProps> = ({
  children,
  agent,
  visible,
  setVisible,
  afterUpdate,
}) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    typeof visible != 'undefined' && setOpen(visible);
  }, [visible]);

  useEffect(() => {
    if (typeof setVisible != 'undefined') {
      setTimeout(() => {
        setVisible(open);
      });
    }
  }, [open]);

  const form = useForm<IAgentInfo>({
    resolver: zodResolver(agentInfoSchema),
    defaultValues: {
      displayName: agent?.displayName ?? t('agent.info.default-agent-name'),
      description: agent?.description ?? '',
      iconUrl: agent?.iconUrl ?? DEFAULT_AGENT_ICON_URL,
    },
  });

  useEffect(() => {
    if (!agent) return;
    form.reset({
      displayName: agent.displayName || t('agent.info.default-agent-name'),
      description: agent.description || '',
      iconUrl: agent.iconUrl || DEFAULT_AGENT_ICON_URL,
    });
  }, [agent, form, t]);

  const agentId = agent?.id;
  const { mutate } = useGetAgent(agentId);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!agentId) {
      setIsLoading(false);
      toast.error(t('agent.info.agent-id-empty'));
      return;
    }
    const newAgent = await updateAgent(agentId, data);
    if (newAgent) {
      afterUpdate ? afterUpdate() : await mutate();
      setOpen(false);
      setIsLoading(false);
      toast.success(t('agent.info.agent-updated'));
    } else {
      toast.error(t('agent.info.agent-update-failed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('agent.info.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agent.info.form.agent-name')}</FormLabel>
                  <FormControl>
                    <I18nInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('agent.info.form.agent-name-placeholder')}
                      autoFocus
                      dialogTitle={t('agent.info.form.agent-name')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agent.info.form.agent-desc')}</FormLabel>
                  <FormControl>
                    <I18nTextarea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('agent.info.form.agent-desc-placeholder')}
                      className="h-28 resize-none"
                      dialogTitle={t('agent.info.form.agent-desc')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('agent.info.form.agent-icon')}</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} defaultValue={agent?.iconUrl} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                {t('agent.info.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
