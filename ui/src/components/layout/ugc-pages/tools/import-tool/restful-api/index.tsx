import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { IImportTool, importToolSchema, ToolImportType } from '@/schema/workspace/tools-import.ts';

const HTTP_METHOD_OPTIONS: Array<{
  value: string;
  displayName: string;
}> = [
  {
    value: 'GET',
    displayName: 'GET',
  },
  {
    value: 'POST',
    displayName: 'POST',
  },
  {
    value: 'PUT',
    displayName: 'PUT',
  },
  {
    value: 'DELETE',
    displayName: 'DELETE',
  },
];

const CREDENTIAL_PLACE_AT_OPTIONS: Array<{
  value: string;
  displayName: string;
}> = [
  {
    value: 'header',
    displayName: 'Header',
  },
  {
    value: 'query',
    displayName: 'Query',
  },
  {
    value: 'body',
    displayName: 'Body',
  },
];

interface IImportToolServiceProps {
  onFinished?: () => void;
}

export const ImportToolService: React.FC<IImportToolServiceProps> = ({ onFinished }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportTool>({
    resolver: zodResolver(importToolSchema),
    defaultValues: {
      importType: ToolImportType.api,
      apiInfo: {
        iconUrl: 'emoji:🍀:#ceefc5',
      },
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (!data.apiInfo.displayName) {
      toast.warning(t('ugc-page.tools.import.restful-api.form.validate.display-name-is-empty'));
      return;
    }
    if (!data.apiInfo.url) {
      toast.warning('ugc-page.tools.import.restful-api.form.validate.url-is-empty');
      return;
    }
    if (!data.apiInfo.method) {
      toast.warning('ugc-page.tools.import.restful-api.form.validate.method-is-empty');
      return;
    }
    if (!data.apiInfo.properties) {
      toast.warning(t('ugc-page.tools.import.restful-api.form.validate.properties-is-empty'));
      return;
    }

    try {
      data.apiInfo.properties = JSON.parse(data.apiInfo.properties);
    } catch (e) {
      toast.warning(t('ugc-page.tools.import.restful-api.form.validate.parse-json-error'));
      return;
    }

    try {
      data.apiInfo.output = JSON.parse(data.apiInfo.output);
    } catch (e) {
      toast.warning(t('ugc-page.tools.import.restful-api.form.validate.parse-output-error'));
      return;
    }

    if (!data.apiInfo.output) {
      toast.warning(t('ugc-page.tools.import.restful-api.form.validate.output-is-empty'));
      return;
    }

    setIsLoading(true);
    toast.promise(importTool(data), {
      loading: t('ugc-page.tools.import.restful-api.form.loading'),
      success: () => {
        onFinished?.();
        return t('ugc-page.tools.import.restful-api.form.success');
      },
      error: t('ugc-page.tools.import.restful-api.form.error'),
      finally: () => setIsLoading(false),
    });
  });

  const [apiInfo = {}] = form.watch(['apiInfo']);

  const { credentialPlaceAt } = apiInfo;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <ScrollArea className="-ml-1 -mr-3.5 h-[calc(100vh-22rem)] pr-3 [&>[data-radix-scroll-area-viewport]>div]:px-1">
          <div className="w-full space-y-2">
            <FormLabel>{t('ugc-page.tools.import.restful-api.form.display-name.label')}</FormLabel>
            <div className="flex w-full items-center gap-2">
              <FormField
                name="apiInfo.iconUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <VinesIconEditor
                        value={field.value ?? ''}
                        defaultValue="emoji:🍀:#ceefc5"
                        onChange={field.onChange}
                        size="md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="apiInfo.displayName"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        placeholder={t('ugc-page.tools.import.restful-api.form.display-name.placeholder')}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            name="apiInfo.description"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.description.label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('ugc-page.tools.import.restful-api.form.description.placeholder')}
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
            name="apiInfo.url"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.url.label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('ugc-page.tools.import.restful-api.form.url.placeholder')}
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
            name="apiInfo.method"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.method.label')}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('ugc-page.tools.import.restful-api.form.method.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HTTP_METHOD_OPTIONS.map((option) => (
                        <SelectItem value={option.value} key={option.value}>
                          {option.displayName}
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
            name="apiInfo.credentialPlaceAt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.credential-place-at.label')}</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('ugc-page.tools.import.restful-api.form.credential-place-at.placeholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CREDENTIAL_PLACE_AT_OPTIONS.map((option) => (
                        <SelectItem value={option.value} key={option.value}>
                          {option.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {credentialPlaceAt && (
            <FormField
              name="apiInfo.credentialValue"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.tools.import.restful-api.form.credential-value.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('ugc-page.tools.import.restful-api.form.credential-value.placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {credentialPlaceAt && (
            <FormField
              name="apiInfo.credentialKey"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.tools.import.restful-api.form.credential-key.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('ugc-page.tools.import.restful-api.form.credential-key.placeholder')}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            name="apiInfo.properties"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.properties.label')}</FormLabel>
                <FormControl>
                  <CodeEditor data={field.value} onUpdate={field.onChange} height={200} lineNumbers={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="apiInfo.output"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ugc-page.tools.import.restful-api.form.output.label')}</FormLabel>
                <FormControl>
                  <CodeEditor data={field.value} onUpdate={field.onChange} height={200} lineNumbers={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" loading={isLoading} variant="solid" size="small">
            {t('common.utils.import')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
