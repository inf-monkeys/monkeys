import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { designProjectInfoSchema, IDesignProjectInfo } from '@/schema/design/design-project-info.ts';
import { getI18nContent } from '@/utils';

interface IDesignProjectInfoEditorProps {
  children?: React.ReactNode;
  designProject?: IAssetItem<IDesignProject>;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  afterUpdate?: () => void;
  disabled?: boolean;
}

export const DesignProjectInfoEditor: React.FC<IDesignProjectInfoEditorProps> = ({
  children,
  designProject,
  visible,
  setVisible,
  afterUpdate,
  disabled,
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

  const form = useForm<IDesignProjectInfo>({
    resolver: zodResolver(designProjectInfoSchema),
    defaultValues: {
      displayName: getI18nContent(designProject?.displayName) ?? t('design.project.info.default-project-name'),
      description: getI18nContent(designProject?.description) ?? '',
      iconUrl: designProject?.iconUrl ?? 'emoji:🎨:#eeeef1',
    },
  });

  useEffect(() => {
    if (!designProject) return;
    form.setValue(
      'displayName',
      getI18nContent(designProject.displayName) || t('design.project.info.default-project-name'),
    );
    form.setValue('description', getI18nContent(designProject.description) || '');
    form.setValue('iconUrl', designProject.iconUrl || 'emoji:🎨:#eeeef1');
  }, [designProject]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (disabled) return;

    setIsLoading(true);
    if (!designProject?.id) {
      setIsLoading(false);
      toast.error(t('design.project.info.project-id-empty'));
      return;
    }
    const newProject = await updateDesignProject(designProject.id, data);
    if (newProject) {
      afterUpdate?.();
      setOpen(false);
      setIsLoading(false);
      toast.success(t('design.project.info.project-updated'));
    } else {
      toast.error(t('design.project.info.project-update-failed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={disabled ? void 0 : setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('design.project.info.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('design.project.info.form.project-name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('design.project.info.form.project-name-placeholder')}
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
                  <FormLabel>{t('design.project.info.form.project-desc')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('design.project.info.form.project-desc-placeholder')}
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
                  <FormLabel>{t('design.project.info.form.project-icon')}</FormLabel>
                  <FormControl>
                    <VinesIconEditor
                      value={field.value ?? 'emoji:🎨:#eeeef1'}
                      defaultValue={designProject?.iconUrl}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                {t('design.project.info.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
