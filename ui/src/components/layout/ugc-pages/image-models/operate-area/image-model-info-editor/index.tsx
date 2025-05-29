import React, { useEffect, useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateComfyuiModel } from '@/apis/comfyui-model';
import { IComfyuiModel } from '@/apis/comfyui-model/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesImageEditor } from '@/components/ui/image-editor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { comfyuiModelInfoSchema, IComfyuiModelInfo } from '@/schema/workspace/comfyui-model-info.ts';
import { getI18nContent } from '@/utils';

interface IImageModelInfoEditorProps {
  model?: IComfyuiModel;
  children?: React.ReactNode;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
}

export const ImageModelInfoEditor: React.FC<IImageModelInfoEditorProps> = ({
  model,
  children,
  visible,
  setVisible,
  afterUpdate,
}) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const mutateModelList = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui/servers'));

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

  const form = useForm<IComfyuiModelInfo>({
    resolver: zodResolver(comfyuiModelInfoSchema),
  });

  useEffect(() => {
    if (!model) return;
    form.setValue('displayName', getI18nContent(model.displayName) || '');
    form.setValue('description', getI18nContent(model.description) || '');
    form.setValue('iconUrl', model.iconUrl || DEFAULT_WORKFLOW_ICON_URL);
  }, [model]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!model) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsLoading(true);
    const newModel = await updateComfyuiModel(model.id, data);
    if (newModel) {
      afterUpdate ? afterUpdate() : await mutateModelList();
      setOpen(false);
      setIsLoading(false);
      toast.success(t('ugc-page.image-models.ugc-view.operate-area.info-editor.info-updated'));
    } else {
      toast.error(t('ugc-page.image-models.ugc-view.operate-area.info-editor.info-update-failed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('ugc-page.image-models.ugc-view.operate-area.info-editor.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('comfyui.comfyui-model.form.display-name.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-model.form.display-name.placeholder')}
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
                  <FormLabel>{t('comfyui.comfyui-model.form.description.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('comfyui.comfyui-model.form.description.placeholder')}
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
                  <FormLabel>{t('comfyui.comfyui-model.form.icon-url.label')}</FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <VinesImageEditor value={field.value} onChange={field.onChange} aspectRatio={1}>
                        <VinesIcon size="md" src={field.value ?? DEFAULT_WORKFLOW_ICON_URL} disabledPreview />
                      </VinesImageEditor>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                {t('common.utils.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
