import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createComfyuiModelType } from '@/apis/comfyui-model';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { createComfyuiModelTypeSchema, ICreateComfyuiModelType } from '@/schema/workspace/create-comfyui-model-type.ts';

interface ICreateTypeModalProps {
  children?: React.ReactNode;
}

export const CreateTypeModal: React.FC<ICreateTypeModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const mutateComfyuiModelsAndTypes = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui-models'));

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ICreateComfyuiModelType>({
    resolver: zodResolver(createComfyuiModelTypeSchema),
    defaultValues: {},
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(createComfyuiModelType(data), {
      loading: t('common.create.loading'),
      success: () => {
        setOpen(false);
        void mutateComfyuiModelsAndTypes();
        return t('common.create.success');
      },
      error: t('common.create.error'),
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('comfyui.comfyui-model-type.create-label')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('comfyui.comfyui-model-type.table.columns.name.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-model-type.form.name.placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>{t('comfyui.comfyui-model-type.form.name.description')}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              name="path"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('comfyui.comfyui-model-type.table.columns.path.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-model-type.form.path.placeholder')}
                      {...field}
                      className="grow"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>{t('comfyui.comfyui-model-type.form.path.description')}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('comfyui.comfyui-model-type.table.columns.display-name.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-model-type.form.display-name.placeholder')}
                      {...field}
                      className="grow"
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
                  <FormLabel>{t('comfyui.comfyui-model-type.table.columns.description.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-model-type.form.description.placeholder')}
                      {...field}
                      className="grow"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid" size="small">
                {t('common.utils.confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
