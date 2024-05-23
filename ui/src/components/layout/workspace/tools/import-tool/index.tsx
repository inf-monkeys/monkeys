import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Updater } from '@/components/ui/updater';
import { IImportTool, ToolImportType, ToolOpenAPISpecType, importToolSchema } from '@/schema/workspace/tools-import.ts';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ImportToolModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IImportTool>({
    resolver: zodResolver(importToolSchema),
    defaultValues: {
      importType: ToolImportType.manifest,
      openapiSpecType: ToolOpenAPISpecType.upload,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (data.importType === ToolImportType.manifest && !data.manifestUrl) {
      toast.warning('Manifest 地址不能为空');
      return;
    }
    if (data.importType === ToolImportType.openapiSpec) {
      if (!data.openapiSpecUrl) {
        toast.warning('Swagger Spec 地址不能为空');
        return;
      }
      if (!data.namespace) {
        toast.warning('唯一标志不能为空');
        return;
      }
    }
    setIsLoading(true);
    toast.promise(importTool(data), {
      loading: '导入中...',
      success: () => {
        setOpen(false);
        return '导入成功';
      },
      error: '导入失败',
      finally: () => setIsLoading(false),
    });
  });

  const toolDefTypeOptions = [
    {
      value: ToolImportType.manifest,
      displayName: 'Manifest 文件',
    },
    {
      value: ToolImportType.openapiSpec,
      displayName: 'Swagger Spec 文件',
    },
  ];

  const swaggerSpecTypeOptions = [
    {
      value: ToolOpenAPISpecType.url,
      displayName: 'url',
    },
    {
      value: ToolOpenAPISpecType.upload,
      displayName: '上传文件',
    },
  ];
  const { importType, openapiSpecType } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>导入工具</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="importType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工具声明类型</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择一个工具声明类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toolDefTypeOptions.map((option) => (
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

            {importType === ToolImportType.manifest && (
              <>
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
              </>
            )}

            {importType === ToolImportType.openapiSpec && (
              <>
                <FormField
                  name="namespace"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>唯一标志</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入唯一标志" {...field} className="grow" autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="openapiSpecType"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swagger Spec 类型</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择一个 Swagger Spec 类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {swaggerSpecTypeOptions.map((option) => (
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
                {openapiSpecType === ToolOpenAPISpecType.url && (
                  <FormField
                    name="openapiSpecUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Swagger Spec 地址</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入 Swagger Spec 地址" {...field} className="grow" autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {openapiSpecType === ToolOpenAPISpecType.upload && (
                  <FormField
                    name="openapiSpecUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Updater
                            accept={['application/json', 'application/yaml', 'application/yml']}
                            maxSize={20}
                            limit={1}
                            onFinished={(urls) => {
                              field.onChange(urls[0]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>在此处上传文件将自动存入「富媒体数据」</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
