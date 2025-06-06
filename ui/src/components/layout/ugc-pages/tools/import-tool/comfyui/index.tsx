import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Server } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ComfyUIServerListModal } from 'src/components/layout/ugc-pages/comfyui/comfyui-server-list';

import { importComfyuiWorkflow } from '@/apis/comfyui';
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
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { DEFAULT_COMFYUI_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
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
      iconUrl: DEFAULT_COMFYUI_WORKFLOW_ICON_URL,
      workflowType: 'json',
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

  const { workflowType } = form.getValues();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <ScrollArea className="-ml-1 -mr-3.5 flex max-h-96 flex-col pr-3 [&>[data-radix-scroll-area-viewport]>div]:px-1">
          <div className="w-full space-y-2">
            <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.display-name.label')}</FormLabel>
            <div className="flex w-full items-center gap-2">
              <FormField
                name="iconUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <VinesIconEditor
                        value={field.value ?? ''}
                        defaultValue={DEFAULT_COMFYUI_WORKFLOW_ICON_URL}
                        onChange={field.onChange}
                        size="md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="displayName"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.tools.import.import-comfyui-workflow.form.display-name.placeholder')}
                        {...field}
                        className="grow"
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

          {/*<FormField*/}
          {/*  name="workflowType"*/}
          {/*  control={form.control}*/}
          {/*  render={({ field }) => (*/}
          {/*    <FormItem>*/}
          {/*      <FormLabel>{t('ugc-page.tools.import.import-comfyui-workflow.form.workflowType.label')}</FormLabel>*/}
          {/*      <FormControl>*/}
          {/*        <Select onValueChange={field.onChange} defaultValue={field.value}>*/}
          {/*          <FormControl>*/}
          {/*            <SelectTrigger>*/}
          {/*              <SelectValue*/}
          {/*                placeholder={t('ugc-page.tools.import.import-comfyui-workflow.form.workflowType.placeholder')}*/}
          {/*              />*/}
          {/*            </SelectTrigger>*/}
          {/*          </FormControl>*/}
          {/*          <SelectContent>*/}
          {/*            {comfyuiWorkflowTypeOptions.map((option) => (*/}
          {/*              <SelectItem value={option} key={option}>*/}
          {/*                {t(`ugc-page.tools.import.import-comfyui-workflow.form.workflowType.options.${option}`)}*/}
          {/*              </SelectItem>*/}
          {/*            ))}*/}
          {/*          </SelectContent>*/}
          {/*        </Select>*/}
          {/*      </FormControl>*/}
          {/*      <FormMessage />*/}
          {/*    </FormItem>*/}
          {/*  )}*/}
          {/*/>*/}

          {workflowType === 'image' && (
            <>
              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <VinesUploader
                        accept={['png', 'jpg', 'gif', 'jpeg']}
                        maxSize={20}
                        max={1}
                        onChange={(urls) => field.onChange(urls[0])}
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
                      <>
                        <Input {...field} className="grow" />
                        <VinesUploader
                          className="rounded border border-input"
                          accept={['json']}
                          maxSize={20}
                          max={1}
                          onChange={(urls) => field.onChange(urls[0])}
                          basePath="user-files/import-comfyui-json"
                        />
                      </>
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
                      <>
                        <Input {...field} className="grow" />
                        <VinesUploader
                          className="rounded border border-input"
                          accept={['json']}
                          maxSize={20}
                          max={1}
                          onChange={(urls) => field.onChange(urls[0])}
                          basePath="user-files/import-comfyui-json-url"
                        />
                      </>
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
              {t('comfyui.comfyui-server.title')}
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
