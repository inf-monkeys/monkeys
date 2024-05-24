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
import { Separator } from '@/components/ui/separator.tsx';
import { PRE_PROCESS_RULES } from '@/schema/text-dataset/import-file.ts';
import { IImportFromOSS, importFromOSSSchema } from '@/schema/text-dataset/import-oss.ts';

interface IImportOSSProps {
  textId: string;
  children: React.ReactNode;
}

export const ImportOSS: React.FC<IImportOSSProps> = ({ children, textId }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { trigger } = useUploadDocumentToKnowledgeBase(textId);

  const form = useForm<IImportFromOSS>({
    resolver: zodResolver(importFromOSSSchema),
    defaultValues: {
      ossType: 'TOS',
      ossConfig: {},
      splitterType: 'auto-segment',
      splitterConfig: {},
    },
  });

  const [visible, setVisible] = useState(false);

  const handleSubmit = form.handleSubmit(({ splitterType, splitterConfig, ossType, ossConfig }) => {
    toast.promise(
      trigger({
        knowledgeBaseId: textId,
        ossType,
        ossConfig,
        splitterConfig,
        splitterType,
      } as IUploadDocument),
      {
        loading: t('ugc-page.text-data.detail.import.toast.create-task.loading'),
        success: () => {
          void mutate(`/api/vector/collections/${textId}/tasks`);
          setVisible(false);
          return t('ugc-page.text-data.detail.import.toast.create-task.success');
        },
        error: t('ugc-page.text-data.detail.import.toast.create-task.error'),
      },
    );
  });

  const { ossType, splitterType } = form.getValues();
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>{t('ugc-page.text-data.detail.import.oss.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <ScrollArea className="h-96 px-2 [&>div>div]:p-1">
              <FormField
                name="ossType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossType.label')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('ossConfig.region', val === 'TOS' ? 'cn-beijing' : void 0);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('ugc-page.text-data.detail.import.oss.form.ossType.placeholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TOS">
                            {t('ugc-page.text-data.detail.import.oss.form.ossType.options.TOS')}
                          </SelectItem>
                          <SelectItem value="ALIYUNOSS">
                            {t('ugc-page.text-data.detail.import.oss.form.ossType.options.ALIYUNOSS')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ossType === 'TOS' && (
                <FormField
                  name="ossConfig.region"
                  control={form.control}
                  rules={{ required: t('ugc-page.text-data.detail.import.oss.form.ossConfig.region.tip') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.region.label')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('ugc-page.text-data.detail.import.oss.form.ossConfig.region.placeholder')}
                          {...field}
                          className="grow"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                name="ossConfig.endpoint"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.placeholder', {
                          endpoint:
                            ossType === 'TOS'
                              ? t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.description.TOS')
                              : t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.description.OSS'),
                        })}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormDescription>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.description.content', {
                        endpoint:
                          ossType === 'TOS'
                            ? t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.description.TOS')
                            : t('ugc-page.text-data.detail.import.oss.form.ossConfig.endpoint.description.OSS'),
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.bucketName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.bucketName.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.text-data.detail.import.oss.form.ossConfig.bucketName.placeholder')}
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
                name="ossConfig.bucketType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.bucketType.label')}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('ossConfig.region', val === 'TOS' ? 'cn-beijing' : void 0);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'ugc-page.text-data.detail.import.oss.form.ossConfig.bucketType.placeholder',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">
                            {t('ugc-page.text-data.detail.import.oss.form.ossConfig.bucketType.options.private')}
                          </SelectItem>
                          <SelectItem value="public">
                            {t('ugc-page.text-data.detail.import.oss.form.ossConfig.bucketType.options.public')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.accessKeyId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.accessKeyId.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.text-data.detail.import.oss.form.ossConfig.accessKeyId.placeholder')}
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
                name="ossConfig.accessKeySecret"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.accessKeySecret.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'ugc-page.text-data.detail.import.oss.form.ossConfig.accessKeySecret.placeholder',
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
                name="ossConfig.baseFolder"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.text-data.detail.import.oss.form.ossConfig.baseFolder.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.text-data.detail.import.oss.form.ossConfig.baseFolder.placeholder')}
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
                name="ossConfig.fileExtensions"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.fileExtensions.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'ugc-page.text-data.detail.import.oss.form.ossConfig.fileExtensions.placeholder',
                        )}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormDescription>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.fileExtensions.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.excludeFileRegex"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.excludeFileRegex.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'ugc-page.text-data.detail.import.oss.form.ossConfig.excludeFileRegex.placeholder',
                        )}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormDescription>
                      {t('ugc-page.text-data.detail.import.oss.form.ossConfig.excludeFileRegex.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

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
                提交
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
