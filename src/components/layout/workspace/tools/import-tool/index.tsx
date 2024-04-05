import React, { useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IImportTool, impotrToolSchema } from '@/schema/tools/tools-import';

interface IImportToolModalProps {
  visible?: boolean;
  setVisible?: (v: boolean) => void;
}

export const ImportToolModal: React.FC<IImportToolModalProps> = ({ visible, setVisible }) => {
  const [open, setOpen] = useState(visible ?? false);
  const [isLoading, setIsLoading] = useState(false);

  useMemo(() => {
    typeof visible != 'undefined' && setOpen(visible);
  }, [visible]);

  useMemo(() => {
    if (typeof setVisible != 'undefined') {
      setTimeout(() => {
        setVisible(open);
      });
    }
  }, [open]);

  const form = useForm<IImportTool>({
    resolver: zodResolver(impotrToolSchema),
    defaultValues: {
      manifestUrl: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    const importResult = await importTool(data.manifestUrl);
    if (importResult) {
      toast.success('导入成功');
      setOpen(false);
    } else {
      toast.error('导入工具失败');
    }
    setIsLoading(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
