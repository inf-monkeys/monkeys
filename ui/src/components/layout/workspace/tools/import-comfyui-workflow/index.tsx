import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importComfyuiWorkflow } from '@/apis/comfyui';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Updater } from '@/components/ui/updater';
import { MIME_TYPES } from '@/components/ui/updater/mime-types';
import { IImportComfyUIWorkflow, importComfyUIWorkflowSchema } from '@/schema/workspace/import-comfyui-workflow';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ImportComfyUIWorkflowModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportComfyUIWorkflow>({
    resolver: zodResolver(importComfyUIWorkflowSchema),
    defaultValues: {
      workflowType: 'image',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importComfyuiWorkflow(data), {
      loading: t('common.operate.loading'),
      success: () => {
        setOpen(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  });

  const comfyuiWorkflowTypeOptions = ['image', 'json'];

  const { workflowType } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{t('workspace.tools.import-comfyui-workflow.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <ScrollArea className="h-96 [&>div]:p-2">
              <FormField
                name="workflowType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace.tools.import-comfyui-workflow.form.workflowType.label')}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('workspace.tools.import-comfyui-workflow.form.workflowType.placeholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {comfyuiWorkflowTypeOptions.map((option) => (
                            <SelectItem value={option} key={option}>
                              {t(`workspace.tools.import-comfyui-workflow.form.workflowType.options.${option}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {workflowType === 'image' && (
                <>
                  <FormField
                    name="imageUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Updater
                            accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.gif]}
                            maxSize={20}
                            limit={1}
                            onFinished={(urls) => {
                              field.onChange(urls[0]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {workflowType === 'json' && (
                <>
                  <FormField
                    name="workflowJsonUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workspace.tools.import-comfyui-workflow.form.workflowJsonUrl.label')}</FormLabel>
                        <FormControl>
                          <Updater
                            accept={['application/json']}
                            maxSize={20}
                            limit={1}
                            onFinished={(urls) => {
                              field.onChange(urls[0]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="workflowApiJsonUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('workspace.tools.import-comfyui-workflow.form.workflowApiJsonUrl.label')}
                        </FormLabel>
                        <FormControl>
                          <Updater
                            accept={['application/json']}
                            maxSize={20}
                            limit={1}
                            onFinished={(urls) => {
                              field.onChange(urls[0]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>{t('common.form.description.upload-file-auto-store')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                name="displayName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace.tools.import-comfyui-workflow.form.displayName.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('workspace.tools.import-comfyui-workflow.form.displayName.placeholder')}
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
