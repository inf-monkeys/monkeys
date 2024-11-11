import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemoizedFn } from 'ahooks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { publishApplication } from '@/apis/application-store';
import { IApplicationPublishConfig } from '@/apis/application-store/typings.ts';
import { useWorkflowExecutionThumbnails } from '@/apis/workflow/execution';
import { IPublishToMarketWithAssetsContext } from '@/components/layout/ugc-pages/workflows/publish-to-market/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesImage } from '@/components/ui/image';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { IWorkflowInfo, workflowInfoSchema } from '@/schema/workspace/workflow-info.ts';
import { getI18nContent } from '@/utils';

interface IPublishToMarketProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  context?: IPublishToMarketWithAssetsContext;
}

export const PublishToMarket: React.FC<IPublishToMarketProps> = ({ visible, setVisible, context }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  const { data: outputThumbnails } = useWorkflowExecutionThumbnails(context?.id);

  const publishToMarket = useMemoizedFn((publishConfig: IApplicationPublishConfig = {}) => {
    if (!context?.id) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    toast.promise(publishApplication(context.id, 'workflow', publishConfig), {
      loading: t('common.operate.loading'),
      success: () => {
        setVisible(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  });

  const form = useForm<IWorkflowInfo>({
    resolver: zodResolver(workflowInfoSchema),
    defaultValues: {
      displayName:
        getI18nContent(context?.displayName) ?? t('workspace.wrapper.workflow-info-card.default-workflow-name'),
      description: getI18nContent(context?.description) ?? '',
      iconUrl: '',
    },
  });

  useEffect(() => {
    form.reset({
      displayName:
        getI18nContent(context?.displayName) ?? t('workspace.wrapper.workflow-info-card.default-workflow-name'),
      description: getI18nContent(context?.description) ?? '',
      iconUrl: '',
    });
  }, [context]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    publishToMarket({
      extraAssetData: {
        displayName: data.displayName,
        description: data.description,
        iconUrl: data.iconUrl,
      },
    });
  });

  const { iconUrl } = form.watch();
  const thumbnails = outputThumbnails?.filter((it) => it !== iconUrl && /(png|jpg|jpeg|webp)/.test(it)) ?? [];
  const hasThumbnails = (thumbnails?.length ?? 0) > 0;

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.publish-dialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('components.layout.ugc.publish-dialog.name.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('components.layout.ugc.publish-dialog.name.placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
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
                  <FormLabel>{t('components.layout.ugc.publish-dialog.desc.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('components.layout.ugc.publish-dialog.desc.placeholder')}
                      className="h-28 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field: { value, onChange } }) => {
                return (
                  <FormItem>
                    <FormLabel>{t('components.layout.ugc.publish-dialog.thumbnail.label')}</FormLabel>
                    <FormControl>
                      <div
                        className="space-y-2 rounded border border-input p-2"
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <VinesUploader
                          files={[value]}
                          max={1}
                          accept={['png', 'jpg', 'jpeg', 'webp']}
                          onChange={(urls) => onChange(urls[0])}
                          basePath="user-files/thumbnails"
                        />
                        {hasThumbnails && (
                          <ScrollArea orientation="horizontal" className="[&>div>div[style]]:!block">
                            <div className="flex h-40 w-full flex-nowrap gap-4 [&>div]:flex-shrink-0">
                              {thumbnails.map((it, i) => (
                                <VinesImage
                                  className="!w-auto rounded-md shadow"
                                  onClick={() => onChange(it)}
                                  src={it}
                                  key={i}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <DialogFooter>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setVisible(false);
                  }}
                >
                  {t('common.utils.cancel')}
                </Button>
                <Button variant="solid" type="submit" loading={isLoading}>
                  {t('components.layout.ugc.publish-dialog.button.publish')}
                </Button>
              </DialogFooter>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
