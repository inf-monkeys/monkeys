import React, { useState } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importComfyuiServer } from '@/apis/comfyui';
import { IComfyuiServer } from '@/apis/comfyui/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IImportComfyuiServer, importComfyuiServerSchema } from '@/schema/workspace/import-comfyui-server.ts';

interface IImportComfyUIServerModalProps {
  children?: React.ReactNode;
  mutate: KeyedMutator<IComfyuiServer[] | undefined>;
}

export const ImportComfyUIServerModal: React.FC<IImportComfyUIServerModalProps> = ({ children, mutate }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportComfyuiServer>({
    resolver: zodResolver(importComfyuiServerSchema),
    defaultValues: {},
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importComfyuiServer(data), {
      loading: t('common.operate.loading'),
      success: () => {
        void mutate();
        setOpen(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('comfyui.comfyui-server.import-label')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="address"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('comfyui.comfyui-server.form.address.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-server.form.address.placeholder')}
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
                  <FormLabel>{t('comfyui.comfyui-server.form.description.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('comfyui.comfyui-server.form.description.placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
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
