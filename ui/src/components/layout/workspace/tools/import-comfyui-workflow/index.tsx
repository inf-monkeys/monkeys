import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { IImportComfyUIWorkflow, importComfyUIWorkflowSchema } from '@/schema/workspace/import-comfyui-workflow';
import { MIME_TYPES } from '@mantine/dropzone';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ImportComfyUIWorkflowModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filename, setFilename] = useState('');

  const form = useForm<IImportComfyUIWorkflow>({
    resolver: zodResolver(importComfyUIWorkflowSchema),
    defaultValues: {
      workflowType: 'image',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(importComfyuiWorkflow(data), {
      loading: '导入中...',
      success: () => {
        setOpen(false);
        return '导入成功';
      },
      error: '导入失败',
      finally: () => setIsLoading(false),
    });
  });

  const comfyuiWorkflowTypeOptions = [
    {
      value: 'image',
      displayName: '图片',
    },
    {
      value: 'workflow_api_json',
      displayName: 'workflow_api.json',
    },
  ];

  const { workflowType } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入 ComfyUI 工作流</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <ScrollArea className="h-200 px-2 [&>div>div]:p-1">
              <FormField
                name="workflowType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ComfyUI 工作流类型</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择一个创建类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {comfyuiWorkflowTypeOptions.map((option) => (
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
                            onFilesUpdate={(files) => {
                              setFilename(files[0]?.name ?? '');
                            }}
                          />
                        </FormControl>
                        <FormDescription>在此处上传文件将自动存入「富媒体数据」</FormDescription>
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
                    <FormLabel>显示名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入知识库名称" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ScrollArea>

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
