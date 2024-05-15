import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createDatabase } from '@/apis/table-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { IDatabaseInfo, databaseInfoSchema } from '@/schema/table-database/create-database.ts';

interface ICreateDatabaseProps {}

export const CreateDatabase: React.FC<ICreateDatabaseProps> = () => {
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
    setIsLoading(true);
    toast.promise(createDatabase(data), {
      loading: '正在创建表格...',
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/sql-knowledge-bases'));
        return '表格创建成功';
      },
      error: '表格创建失败',
      finally: () => {
        setIsLoading(false);
        setOpen(false);
      },
    });
  });
  const { createType } = form.getValues();

  const createTypeOptions = [
    {
      displayName: '内建 Sqlite 数据库',
      value: 'builtIn',
    },
    {
      displayName: '外置数据库',
      value: 'external',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          创建表格数据库
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>创建表格数据库</DialogTitle>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="createType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>创建类型</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择一个创建类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {createTypeOptions.map((option) => (
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

            {createType === 'builtIn' && (
              <>
                <FormField
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数据库名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入数据库名称" {...field} className="grow" autoFocus />
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
                      <FormLabel>数据库简介</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请输入数据库简介，不超过 100 字"
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
                      <FormLabel>图标</FormLabel>
                      <FormControl>
                        <VinesIconEditor
                          value={field.value}
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
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数据库类型</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入数据库类型" {...field} className="grow" autoFocus />
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
                      <FormLabel>数据库简介</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请输入数据库简介，不超过 100 字"
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
                      <FormLabel>图标</FormLabel>
                      <FormControl>
                        <VinesIconEditor
                          value={field.value}
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

            <DialogFooter>
              <Button type="submit" loading={isLoading} variant="solid">
                确定
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
