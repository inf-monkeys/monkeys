import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { NumberInput } from '@mantine/core';
import { Edit2Icon, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useKnowledgeBase, useUpdateKnowledgeBase } from '@/apis/vector';
import { ICreateVectorDB } from '@/apis/vector/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import {
  IRetrievalSettings,
  KnowledgeBaseRetrievalMode,
  retrievalSettingsSchema,
} from '@/schema/text-dataset/retrieval-settings';
import { formatTimeDiffPrevious } from '@/utils/time.ts';
import { I18nContent } from '@/utils';

interface IBasicInfoProps {
  textId: string;
}

export const BasicInfo: React.FC<IBasicInfoProps> = ({ textId }) => {
  const { t } = useTranslation();

  const { data: detail, mutate } = useKnowledgeBase(textId);
  const { trigger } = useUpdateKnowledgeBase(detail?.uuid ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = (key: string, val: string) => {
    toast.promise(
      trigger({ [key]: val } as unknown as Pick<ICreateVectorDB, 'displayName' | 'description' | 'iconUrl'>),
      {
        loading: t('common.update.loading'),
        success: () => {
          void mutate();
          return t('common.update.success');
        },
        error: t('common.update.error'),
      },
    );
  };

  const [icon, setIcon] = useState(detail?.iconUrl || 'emoji:🍀:#ceefc5');
  useEffect(() => {
    setIcon(detail?.iconUrl || 'emoji:🍀:#ceefc5');
  }, [detail?.iconUrl]);

  const form = useForm<IRetrievalSettings>({
    resolver: zodResolver(retrievalSettingsSchema),
    defaultValues: {
      mode: detail?.retrievalSettings?.mode || KnowledgeBaseRetrievalMode.VectorSearch,
      topK: detail?.retrievalSettings?.topK || 3,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    if (!textId) {
      setIsLoading(false);
      toast.error(t('common.toast.vector-database-not-found'));
      return;
    }

    toast.promise(
      trigger({
        retrievalSettings: {
          mode: data.mode,
          topK: data.topK,
        },
      } as any),
      {
        loading: t('common.update.loading'),
        success: () => {
          void mutate();
          return t('common.update.success');
        },
        error: t('common.update.error'),
      },
    );
  });

  return (
    <>
      <div>
        <div
          style={{
            padding: 10,
          }}
        >
          <h1 className="text-xl font-bold">{t('ugc-page.text-data.detail.tabs.settings.basic-info.title')}</h1>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">{t('components.layout.ugc.detail.info.columns.displayName.label')}</TableHead>
              <TableHead>{t('components.layout.ugc.detail.info.columns.value.label')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.icon.label')}</TableCell>
              <TableCell>
                <VinesIconEditor
                  value={icon}
                  defaultValue={detail?.iconUrl}
                  onChange={setIcon}
                  onFinished={(val) => handleUpdate('iconUrl', val)}
                  size="sm"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.label')}</TableCell>
              <TableCell className="flex items-center gap-2">
                <span>{I18nContent(detail?.displayName)}</span>
                <InfoEditor
                  title={t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.title')}
                  placeholder={t(
                    'ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.placeholder',
                  )}
                  initialValue={I18nContent(detail?.displayName) || ''}
                  onFinished={(val) => handleUpdate('displayName', val)}
                >
                  <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                    {t('common.utils.edit')}
                  </Button>
                </InfoEditor>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.description.label')}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <span>{I18nContent(detail?.description) || t('components.layout.ugc.utils.no-description')}</span>
                <InfoEditor
                  title={t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.title')}
                  placeholder={t(
                    'ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.placeholder',
                  )}
                  initialValue={I18nContent(detail?.description) || ''}
                  onFinished={(val) => handleUpdate('description', val)}
                >
                  <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                    {t('common.utils.edit')}
                  </Button>
                </InfoEditor>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.dimension.label')}
              </TableCell>
              <TableCell>{detail?.dimension || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.model.label')}</TableCell>
              <TableCell>{detail?.embeddingModel || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.created-time.label')}
              </TableCell>
              <TableCell>{formatTimeDiffPrevious(detail?.createdTimestamp ?? 0)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.updated-time.label')}
              </TableCell>
              <TableCell>{formatTimeDiffPrevious(detail?.updatedTimestamp ?? 0)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div
          style={{
            padding: 10,
          }}
        >
          <h1 className="text-xl font-bold">{t('ugc-page.text-data.detail.tabs.settings.search-settings.title')}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <FormField
              name="mode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.text-data.detail.tabs.settings.search-settings.form.mode.label')}</FormLabel>
                  <FormControl>
                    <FormControl>
                      <Select defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'ugc-page.text-data.detail.tabs.settings.search-settings.form.mode.placeholder',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={KnowledgeBaseRetrievalMode.VectorSearch}>
                            {t('ugc-page.text-data.detail.tabs.settings.search-settings.form.mode.options.vector')}
                          </SelectItem>
                          <SelectItem value={KnowledgeBaseRetrievalMode.FullTextSearch}>
                            {t('ugc-page.text-data.detail.tabs.settings.search-settings.form.mode.options.full-text')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="topK"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.text-data.detail.tabs.settings.search-settings.form.topK.label')}</FormLabel>
                  <FormControl>
                    <NumberInput
                      placeholder={t('ugc-page.text-data.detail.tabs.settings.search-settings.form.topK.placeholder')}
                      className="h-10 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button variant="outline" icon={<Save />} type="submit">
              {t('common.utils.save')}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};
