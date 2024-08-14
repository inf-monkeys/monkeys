import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUploadDocumentToKnowledgeBase } from '@/apis/vector';
import { IUploadDocument } from '@/apis/vector/typings.ts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Uploader } from '@/components/ui/updater';
import { IImportFile, importFileSchema, PRE_PROCESS_RULES } from '@/schema/text-dataset/import-file.ts';

interface IImportFileProps {
  children?: React.ReactNode;
  textId: string;
}

export const ImportFile: React.FC<IImportFileProps> = ({ children, textId }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { trigger } = useUploadDocumentToKnowledgeBase(textId);
  const [filename, setFilename] = useState('');

  const form = useForm<IImportFile>({
    resolver: zodResolver(importFileSchema),
    defaultValues: {
      fileURL: '',
      splitterType: 'auto-segment',
      splitterConfig: {},
    },
  });

  const [visible, setVisible] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    toast.promise(trigger({ knowledgeBaseId: textId, fileName: filename, ...data } as IUploadDocument), {
      loading: t('ugc-page.text-data.detail.import.toast.create-task.loading'),
      success: () => {
        setVisible(false);
        void mutate(`/api/tools/monkey_tools_knowledge_base/knowledge-bases/${textId}/tasks`);
        return t('ugc-page.text-data.detail.import.toast.create-task.success');
      },
      error: t('ugc-page.text-data.detail.import.toast.create-task.error'),
    });
  });

  const { splitterType } = form.getValues();

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>{t('ugc-page.text-data.detail.import.file.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <ScrollArea className="h-80 px-2 [&>div>div]:p-1">
              <FormField
                name="fileURL"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Uploader
                        accept={[
                          'text/plain',
                          'application/pdf',
                          'text/csv',
                          'application/json',
                          'application/ld+json',
                          'application/zip',
                        ]}
                        maxSize={400}
                        limit={1}
                        onFinished={(urls) => {
                          field.onChange(urls[0]);
                        }}
                        onFilesUpdate={(files) => {
                          setFilename(files[0]?.name ?? '');
                        }}
                        basePath="user-files/text-data-file"
                        mode="embed"
                      />
                    </FormControl>
                    <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="splitterType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.common-form.splitterType.label')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === 'custom-segment') {
                            form.setValue('splitterConfig.separator', '\n\n');
                            form.setValue('splitterConfig.chunk_size', 500);
                            form.setValue('splitterConfig.chunk_overlap', 50);
                            form.setValue('preProcessRules', []);
                          } else {
                            form.setValue('splitterConfig.separator', '\n\n');
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('ugc-page.text-data.detail.import.common-form.splitterType.placeholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto-segment">
                            {t('ugc-page.text-data.detail.import.common-form.splitterType.options.auto-segment')}
                          </SelectItem>
                          <SelectItem value="custom-segment">
                            {t('ugc-page.text-data.detail.import.common-form.splitterType.options.custom-segment')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {splitterType === 'auto-segment'
                        ? t('ugc-page.text-data.detail.import.common-form.splitterType.description.auto-segment')
                        : t('ugc-page.text-data.detail.import.common-form.splitterType.description.custom-segment')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {splitterType === 'custom-segment' && (
                <>
                  <FormField
                    name="splitterConfig.separator"
                    control={form.control}
                    rules={{
                      required: t('ugc-page.text-data.detail.import.common-form.splitterConfig.separator.tip'),
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('ugc-page.text-data.detail.import.common-form.splitterConfig.separator.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'ugc-page.text-data.detail.import.common-form.splitterConfig.separator.placeholder',
                            )}
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
                    name="splitterConfig.chunk_size"
                    control={form.control}
                    rules={{
                      required: t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_size.tip'),
                    }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>
                          {t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_size.label')}
                        </FormLabel>
                        <FormDescription>
                          {t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_size.description')}
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="500"
                            value={value?.toString()}
                            onChange={(val) => onChange(Number(val))}
                            className="grow"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="splitterConfig.chunk_overlap"
                    control={form.control}
                    rules={{
                      required: t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_overlap.tip'),
                    }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>
                          {t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_overlap.label')}
                        </FormLabel>
                        <FormDescription>
                          {t('ugc-page.text-data.detail.import.common-form.splitterConfig.chunk_overlap.description')}
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="50"
                            value={value?.toString()}
                            onChange={(val) => onChange(Number(val))}
                            className="grow"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="preProcessRules"
                    control={form.control}
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>
                            {t('ugc-page.text-data.detail.import.common-form.pre-process-rules.label')}
                          </FormLabel>
                        </div>
                        {PRE_PROCESS_RULES.map((value) => (
                          <FormField
                            key={value}
                            control={form.control}
                            name="preProcessRules"
                            render={({ field }) => {
                              return (
                                <FormItem key={value} className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange(field.value ? [...field.value, value] : [value])
                                          : field.onChange(field.value?.filter((it) => it !== value));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {t(`ugc-page.text-data.detail.import.common-form.pre-process-rules.rules.${value}`)}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" type="submit">
                {t('common.utils.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
