import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importComfyuiServer } from '@/apis/comfyui';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IImportComfyuiServer, importComfyuiServerSchema } from '@/schema/workspace/import-comfyui-server';

interface IImportComfyuiServerModalProps {
  children?: React.ReactNode;
}

export const ImportComfyuiServerModal: React.FC<IImportComfyuiServerModalProps> = ({ children }) => {
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
      <DialogContent className="h-200 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('workspace.tools.import-comfyui-workflow.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <ScrollArea className="h-96 [&>div]:p-2">
              <FormField
                name="address"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace.tools.comfyui-server.form.address.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('workspace.tools.comfyui-server.form.address.placeholder')}
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
                    <FormLabel>{t('workspace.tools.comfyui-server.form.description.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('workspace.tools.comfyui-server.form.description.placeholder')}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ScrollArea>

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
