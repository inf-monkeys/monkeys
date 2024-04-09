import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IImportTool, impotrToolSchema } from '@/schema/tools/tools-import';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ImportToolModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportTool>({
    resolver: zodResolver(impotrToolSchema),
    defaultValues: {
      manifestUrl: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importTool(data.manifestUrl), {
      loading: '导入中...',
      success: () => {
        setOpen(false);
        return '导入成功';
      },
      error: '导入失败',
      finally: () => setIsLoading(false),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入工具</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="manifestUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manifest 地址</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入 Manifest 地址" {...field} className="grow" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
