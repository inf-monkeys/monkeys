import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createTableUseSQL } from '@/apis/table-data';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { ICreateTable, createTableSchema } from '@/schema/table-database/create-table.ts';

interface ICreateTableProps {
  databaseId: string;
  children?: React.ReactNode;
}

export const CreateTable: React.FC<ICreateTableProps> = ({ databaseId, children }) => {
  const { mutate } = useSWRConfig();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ICreateTable>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      sql: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(createTableUseSQL(databaseId, data.sql), {
      loading: '正在使用 SQL 创建表中',
      success: () => {
        setVisible(false);
        setTimeout(
          () =>
            mutate((key) => typeof key === 'string' && key.startsWith(`/api/sql-knowledge-bases/${databaseId}/tables`)),
          1000,
        );
        return '使用 SQL 创建表成功，请稍后查看';
      },
      error: '使用 SQL 创建表失败',
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>使用 SQL 语句建表</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <FormField
              name="sql"
              control={form.control}
              render={({ field: { value, onChange } }) => (
                <FormItem>
                  <FormLabel>SQL 语句</FormLabel>
                  <FormControl>
                    <CodeEditor
                      height={256}
                      language="sql"
                      data={value}
                      onUpdate={onChange}
                      lineNumbers={2}
                      minimap={false}
                    />
                  </FormControl>
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
