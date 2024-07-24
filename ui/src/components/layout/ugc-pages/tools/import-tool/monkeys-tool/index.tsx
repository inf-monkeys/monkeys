import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IImportTool, importToolSchema, ToolImportType, ToolOpenAPISpecType } from '@/schema/workspace/tools-import.ts';

interface IImportToolWithManifestProps {
  onFinished?: () => void;
}

export const ImportToolWithManifest: React.FC<IImportToolWithManifestProps> = ({ onFinished }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportTool>({
    resolver: zodResolver(importToolSchema),
    defaultValues: {
      importType: ToolImportType.manifest,
      openapiSpecType: ToolOpenAPISpecType.upload,

      apiInfo: {
        credentialKey: 'Authorization',
      },
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (data.importType === ToolImportType.manifest && !data.manifestUrl) {
      toast.warning(t('ugc-page.tools.import.monkeys-tool.form.validate.manifest-url-is-empty'));
      return;
    }

    setIsLoading(true);
    toast.promise(importTool(data), {
      loading: t('ugc-page.tools.import.monkeys-tool.form.loading'),
      success: () => {
        onFinished?.();
        return t('ugc-page.tools.import.monkeys-tool.form.success');
      },
      error: t('ugc-page.tools.import.monkeys-tool.form.error'),
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mx-1 flex flex-col gap-2">
        <FormField
          name="manifestUrl"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ugc-page.tools.import.monkeys-tool.form.manifest-url.label')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('ugc-page.tools.import.monkeys-tool.form.manifest-url.placeholder')}
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
            {t('common.utils.import')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
