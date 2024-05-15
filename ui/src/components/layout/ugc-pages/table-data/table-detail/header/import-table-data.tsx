import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { importToDatabaseUseCSV } from '@/apis/table-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Updater } from '@/components/ui/updater';
import { IImportFile, importFileSchema } from '@/schema/table-database/import-file.ts';
import { MIME_TYPES } from '@mantine/dropzone';

interface IImportTableDataProps {
  databaseId: string;
  children?: React.ReactNode;
}

export const ImportTableData: React.FC<IImportTableDataProps> = ({ databaseId, children }) => {
  const { mutate } = useSWRConfig();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportFile>({
    resolver: zodResolver(importFileSchema),
    defaultValues: {
      tableName: '',
      url: '',
      sep: ',',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importToDatabaseUseCSV(databaseId, data.tableName, data.url, data.sep), {
      loading: '正在导入数据',
      success: () => {
        setVisible(false);
        setTimeout(
          () =>
            mutate((key) => typeof key === 'string' && key.startsWith(`/api/sql-knowledge-bases/${databaseId}/tables`)),
          2000,
        );
        return '导入成功，后台转换中，请稍后查看';
      },
      error: '导入失败',
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>通过 CSV 导入表数据</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <FormField
              name="tableName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入表名" className="grow" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="url"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Updater
                      accept={[MIME_TYPES.csv, MIME_TYPES.xls, MIME_TYPES.xlsx]}
                      maxSize={10}
                      limit={1}
                      onFinished={(urls) => field.onChange(urls[0])}
                    />
                  </FormControl>
                  <FormDescription>在此处上传文件将自动存入「富媒体数据」</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="sep"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入分隔符" {...field} />
                  </FormControl>
                  <FormDescription>如果上传的是 csv 文件，请指定 CSV 的分隔符，默认为逗号</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="submit" loading={isLoading}>
                提交
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
