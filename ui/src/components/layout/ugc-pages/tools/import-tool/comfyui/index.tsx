import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Server } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importComfyuiWorkflow } from '@/apis/comfyui';
import { ComfyUIServerListModal } from '@/components/layout/ugc-pages/tools/comfyui-server-list';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Updater } from '@/components/ui/updater';
import { MIME_TYPES } from '@/components/ui/updater/mime-types.ts';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { IImportComfyUIWorkflow, importComfyUIWorkflowSchema } from '@/schema/workspace/import-comfyui-workflow.ts';

interface IImportComfyUIWorkflowProps {
  onFinished?: () => void;
}

export const ImportComfyUIWorkflow: React.FC<IImportComfyUIWorkflowProps> = ({ onFinished }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();

  const form = useForm<IImportComfyUIWorkflow>({
    resolver: zodResolver(importComfyUIWorkflowSchema),
    defaultValues: {
      iconUrl: 'emoji:🍀:#ceefc5',
      workflowType: 'image',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importComfyuiWorkflow(data), {
      loading: t('common.operate.loading'),
      success: () => {
        onFinished?.();
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui/workflows'));
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  });

  const comfyuiWorkflowTypeOptions = ['image', 'json'];

  const { workflowType } = form.getValues();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <ScrollArea className="h-96 pr-3 [&>[data-radix-scroll-area-viewport]>div]:px-1">
          <FormField
            name="displayName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.displayName.label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('ugc-page.tools.import.import-comfyui-workflow.form.displayName.placeholder')}
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
                <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.description.label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('ugc-page.tools.import.import-comfyui-workflow.form.description.placeholder')}
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
            name="iconUrl"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.icon.label')}</FormLabel>
                <FormControl>
                  <VinesIconEditor
                    value={field.value ?? ''}
                    defaultValue="emoji:🍀:#ceefc5"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="workflowType"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.workflowType.label')}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('ugc-page.tools.import.import-comfyui-workflow.form.workflowType.placeholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {comfyuiWorkflowTypeOptions.map((option) => (
                        <SelectItem value={option} key={option}>
                          {t(`ugc-page.tools.import.import-comfyui-workflow.form.workflowType.options.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {workflowType === 'image' && (
            <>
              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Updater
                        accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.gif]}
                        maxSize={20}
                        limit={1}
                        onFinished={(urls) => {
                          field.onChange(urls[0]);
                        }}
                        basePath="user-files/import-comfyui-image"
                      />
                    </FormControl>
                    <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {workflowType === 'json' && (
            <>
              <FormField
                name="workflowJsonUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.tools.import.import-comfyui-workflow.form.workflowJsonUrl.label')}
                    </FormLabel>
                    <FormControl>
                      <Updater
                        accept={['application/json']}
                        maxSize={20}
                        limit={1}
                        onFinished={(urls) => {
                          field.onChange(urls[0]);
                        }}
                        basePath="user-files/import-comfyui-json"
                      />
                    </FormControl>
                    <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="workflowApiJsonUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.tools.import.import-comfyui-workflow.form.workflowApiJsonUrl.label')}
                    </FormLabel>
                    <FormControl>
                      <Updater
                        accept={['application/json']}
                        maxSize={20}
                        limit={1}
                        onFinished={(urls) => {
                          field.onChange(urls[0]);
                        }}
                        basePath="user-files/import-comfyui-json-url"
                      />
                    </FormControl>
                    <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </ScrollArea>

        <DialogFooter className="sm:justify-between">
          <ComfyUIServerListModal>
            <Button variant="outline" size="small" icon={<Server />}>
              {t('ugc-page.tools.import.comfyui-server.title')}
            </Button>
          </ComfyUIServerListModal>
          <Button type="submit" loading={isLoading} variant="solid" size="small">
            {t('common.utils.import')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
