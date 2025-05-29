import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2Icon, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useKnowledgeBase, useKnowledgeBaseMetadataFields, useUpdateKnowledgeBase } from '@/apis/vector';
import { ICreateVectorDB } from '@/apis/vector/typings.ts';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_ASSET_ICON_URL } from '@/consts/icons.ts';
import {
  IRetrievalSettings,
  KnowledgeBaseRetrievalMode,
  retrievalSettingsSchema,
} from '@/schema/text-dataset/retrieval-settings';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

interface IBasicInfoProps {
  textId: string;
}

export const BasicInfo: React.FC<IBasicInfoProps> = ({ textId }) => {
  const { t } = useTranslation();

  const { data: detail, mutate } = useKnowledgeBase(textId);
  const { trigger } = useUpdateKnowledgeBase(detail?.uuid ?? '');
  const { data: fields } = useKnowledgeBaseMetadataFields(textId);

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

  const [icon, setIcon] = useState(detail?.iconUrl || DEFAULT_ASSET_ICON_URL);
  useEffect(() => {
    setIcon(detail?.iconUrl || DEFAULT_ASSET_ICON_URL);
  }, [detail?.iconUrl]);

  const form = useForm<IRetrievalSettings>({
    resolver: zodResolver(retrievalSettingsSchema),
    defaultValues: {
      mode: detail?.retrievalSettings?.mode || KnowledgeBaseRetrievalMode.VectorSearch,
      topK: detail?.retrievalSettings?.topK || 3,
      enabledMetadataFilter: detail?.retrievalSettings?.enabledMetadataFilter || false,
      metadataFilterKey: detail?.retrievalSettings?.metadataFilterKey || '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!textId) {
      toast.error(t('common.toast.vector-database-not-found'));
      return;
    }
    toast.promise(
      trigger({
        retrievalSettings: {
          mode: data.mode,
          topK: data.topK,
          enabledMetadataFilter: data.enabledMetadataFilter,
          metadataFilterKey: data.metadataFilterKey,
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

  const { enabledMetadataFilter = false } = form.getValues();

  return (
    <ScrollArea className="h-full max-h-[calc(100%-3rem)]">
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
                <span>{getI18nContent(detail?.displayName)}</span>
                <SimpleInputDialog
                  title={t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.title')}
                  placeholder={t(
                    'ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.placeholder',
                  )}
                  initialValue={getI18nContent(detail?.displayName) || ''}
                  onFinished={(val) => handleUpdate('displayName', val)}
                >
                  <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                    {t('common.utils.edit')}
                  </Button>
                </SimpleInputDialog>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.description.label')}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <span>{getI18nContent(detail?.description) || t('components.layout.ugc.utils.no-description')}</span>
                <SimpleInputDialog
                  title={t('ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.title')}
                  placeholder={t(
                    'ugc-page.text-data.detail.tabs.settings.basic-info.table.columns.name.info-editor.placeholder',
                  )}
                  initialValue={getI18nContent(detail?.description) || ''}
                  onFinished={(val) => handleUpdate('description', val)}
                >
                  <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                    {t('common.utils.edit')}
                  </Button>
                </SimpleInputDialog>
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
                      <Select defaultValue={field.value} onValueChange={field.onChange}>
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
                    <Input
                      placeholder={t('ugc-page.text-data.detail.tabs.settings.search-settings.form.topK.placeholder')}
                      className="h-10 resize-none"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="enabledMetadataFilter"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('ugc-page.text-data.detail.tabs.settings.search-settings.form.enabledMetadataFilter.label')}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      'ugc-page.text-data.detail.tabs.settings.search-settings.form.enabledMetadataFilter.placeholder',
                    )}
                  </FormDescription>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {enabledMetadataFilter && (
              <FormField
                name="metadataFilterKey"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('ugc-page.text-data.detail.tabs.settings.search-settings.form.metadataFilterKey.label')}
                    </FormLabel>
                    <FormDescription>
                      {t('ugc-page.text-data.detail.tabs.settings.search-settings.form.metadataFilterKey.placeholder')}
                    </FormDescription>
                    <FormControl>
                      <Select defaultValue={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'ugc-page.text-data.detail.tabs.settings.search-settings.form.metadataFilterKey.placeholder',
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fields?.map((it, i) => (
                            <SelectItem value={it.name} key={i}>
                              {getI18nContent(it.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button variant="outline" icon={<Save />} type="submit">
              {t('common.utils.save')}
            </Button>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
};
