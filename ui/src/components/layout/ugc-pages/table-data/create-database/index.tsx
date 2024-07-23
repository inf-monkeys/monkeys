import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDatabase } from '@/apis/table-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { databaseInfoSchema, IDatabaseInfo } from '@/schema/table-database/create-database.ts';

interface ICreateDatabaseProps {}

export const CreateDatabase: React.FC<ICreateDatabaseProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const form = useForm<IDatabaseInfo>({
    resolver: zodResolver(databaseInfoSchema),
    defaultValues: {
      createType: 'builtIn',
      displayName: '',
      description: '',
      iconUrl: 'emoji:🍀:#ceefc5',
    },
  });

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (data.createType === 'builtIn') {
      if (!data.displayName) {
        toast.error('请输入数据库名称');
        return;
      }
    } else if (data.createType === 'external') {
      if (!data.externalDatabaseType) {
        toast.error('请选择数据库类型');
        return;
      }
      if (!data.externalDatabaseConnectionOptions?.host) {
        toast.error('请输入 Host');
        return;
      }
      if (!data.externalDatabaseConnectionOptions?.port) {
        toast.error('请输入 Port');
        return;
      }
      if (!data.externalDatabaseConnectionOptions?.username) {
        toast.error('请输入 Username');
        return;
      }
      if (!data.externalDatabaseConnectionOptions?.password) {
        toast.error('请输入 Password');
        return;
      }
      if (!data.externalDatabaseConnectionOptions?.database) {
        toast.error('请输入 Database');
        return;
      }
    }

    setIsLoading(true);
    toast.promise(createDatabase(data), {
      loading: t('common.create.loading'),
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/sql-knowledge-bases'));
        return t('common.create.success');
      },
      error: t('common.create.error'),
      finally: () => {
        setIsLoading(false);
        setOpen(false);
      },
    });
  });

  const [createType, externalDatabaseType] = form.watch(['createType', 'externalDatabaseType']);

  const createTypeOptions = [
    {
      value: 'builtIn',
    },
    {
      value: 'external',
    },
  ];

  const databaseTypeOptions = [
    {
      displayName: 'Postgres',
      value: 'postgres',
    },
    // {
    //   displayName: 'Mysql',
    //   value: 'mysql',
    // },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('ugc-page.table-data.ugc-view.subtitle.create-database.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('ugc-page.table-data.ugc-view.subtitle.create-database.title')}</DialogTitle>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="createType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ugc-page.table-data.ugc-view.subtitle.create-database.form.type.label')}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'ugc-page.table-data.ugc-view.subtitle.create-database.form.type.placeholder',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {createTypeOptions.map((option) => (
                          <SelectItem value={option.value} key={option.value}>
                            {t(
                              `ugc-page.table-data.ugc-view.subtitle.create-database.form.type.options.${option.value}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createType === 'builtIn' && (
              <>
                <FormField
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('ugc-page.table-data.ugc-view.subtitle.create-database.form.displayName.label')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'ugc-page.table-data.ugc-view.subtitle.create-database.form.displayName.placeholder',
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
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('ugc-page.table-data.ugc-view.subtitle.create-database.form.description.label')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            'ugc-page.table-data.ugc-view.subtitle.create-database.form.description.placeholder',
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
                      <FormLabel>
                        {t('ugc-page.table-data.ugc-view.subtitle.create-database.form.iconUrl.label')}
                      </FormLabel>
                      <FormControl>
                        <VinesIconEditor
                          value={field.value!}
                          defaultValue="emoji:🍀:#ceefc5"
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {createType === 'external' && (
              <>
                <FormField
                  name="externalDatabaseType"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('ugc-page.table-data.ugc-view.subtitle.create-database.form.databaseType.label')}
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'ugc-page.table-data.ugc-view.subtitle.create-database.form.databaseType.placeholder',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {databaseTypeOptions.map((option) => (
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
                  name="externalDatabaseConnectionOptions.host"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input placeholder="Host" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="externalDatabaseConnectionOptions.port"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input placeholder="Port" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {externalDatabaseType === 'postgres' && (
                  <FormField
                    name="externalDatabaseConnectionOptions.schema"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schema</FormLabel>
                        <FormControl>
                          <Input placeholder="Schema" defaultValue={'public'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  name="externalDatabaseConnectionOptions.database"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database</FormLabel>
                      <FormControl>
                        <Input placeholder="Database" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="externalDatabaseConnectionOptions.username"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="externalDatabaseConnectionOptions.password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
