import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateKnowledgeBase, useVectorSupportedEmbeddingModels } from '@/apis/vector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { datasetInfoSchema, IDatasetInfo } from '@/schema/text-dataset';
import { getI18nContent } from '@/utils';

interface ICreateDatasetProps {}

export const CreateDataset: React.FC<ICreateDatasetProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const { data: embeddingModels } = useVectorSupportedEmbeddingModels();
  const { trigger } = useCreateKnowledgeBase();

  const form = useForm<IDatasetInfo>({
    resolver: zodResolver(datasetInfoSchema),
    defaultValues: {
      iconUrl: 'emoji:🍀:#ceefc5',
    },
  });

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(trigger(data), {
      loading: t('common.create.loading'),
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/vector/collections'));
        return t('common.create.success');
      },
      error: t('common.create.error'),
      finally: () => {
        setIsLoading(false);
        setOpen(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('ugc-page.text-data.ugc-view.subtitle.create-dataset.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('ugc-page.text-data.ugc-view.subtitle.create-dataset.title')}</DialogTitle>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('ugc-page.text-data.ugc-view.subtitle.create-dataset.form.displayName.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'ugc-page.text-data.ugc-view.subtitle.create-dataset.form.displayName.placeholder',
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
              name="embeddingModel"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('ugc-page.text-data.ugc-view.subtitle.create-dataset.form.embeddingModel.label')}
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'ugc-page.text-data.ugc-view.subtitle.create-dataset.form.embeddingModel.placeholder',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {embeddingModels?.map((it, i) => (
                          <SelectItem value={it.name} key={i} disabled={!it.enabled}>
                            {getI18nContent(it.displayName)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>
                    {t('ugc-page.text-data.ugc-view.subtitle.create-dataset.form.description.label')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'ugc-page.text-data.ugc-view.subtitle.create-dataset.form.description.placeholder',
                      )}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.text-data.ugc-view.subtitle.create-dataset.form.iconUrl.label')}</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} defaultValue="emoji:🍀:#ceefc5" onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                {t('common.utils.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
