import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { importTool } from '@/apis/tools';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

      apiInfo: {
        credentialKey: 'Authorization',
      },
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

    if (data.importType === ToolImportType.api) {
      if (!data.apiInfo.displayName) {
        toast.warning('显示名称不能为空');
        return;
      }
      if (!data.apiInfo.url) {
        toast.warning('接口地址不能为空');
        return;
      }
      if (!data.apiInfo.method) {
        toast.warning('HTTP 请求方法不能为空');
        return;
      }
      if (!data.apiInfo.credentialPlaceAt) {
        toast.warning('鉴权方式不能为空');
        return;
      }
      if (!data.apiInfo.proprities) {
        toast.warning('请求参数不能为空');
        return;
      }

      try {
        data.apiInfo.proprities = JSON.parse(data.apiInfo.proprities);
      } catch (e) {
        toast.warning('请求参数必须为 JSON 格式');
        return;
      }

      try {
        data.apiInfo.output = JSON.parse(data.apiInfo.output);
      } catch (e) {
        toast.warning('返回数据必须为 JSON 格式');
        return;
      }

      if (!data.apiInfo.output) {
        toast.warning('返回数据不能为空');
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
    {
      value: ToolImportType.api,
      displayName: '手动构建',
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

  const httpMethodOptions: Array<{
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

  const credentialPlaceAtOptions: Array<{
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

  const { importType, openapiSpecType } = form.getValues();

  const { apiInfo = {} } = form.getValues();
  const { credentialPlaceAt } = apiInfo;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>导入工具</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-15rem)]">
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

              {importType === ToolImportType.api && (
                <>
                  <FormField
                    name="apiInfo.displayName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>显示名称</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入显示名称" {...field} className="grow" autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="apiInfo.description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>描述</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入描述" {...field} className="grow" autoFocus />
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
                        <FormLabel>接口地址</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入接口地址" {...field} className="grow" autoFocus />
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
                        <FormLabel>HTTP 请求方法</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="HTTP 请求方法" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {httpMethodOptions.map((option) => (
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
                        <FormLabel>鉴权方式</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="鉴权方式" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {credentialPlaceAtOptions.map((option) => (
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
                          <FormLabel>密钥值</FormLabel>
                          <FormControl>
                            <Input placeholder="密钥值" {...field} className="grow" autoFocus />
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
                          <FormLabel>密钥 Key</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="请输入鉴权时 header/query/body 对应的 key"
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
                    name="apiInfo.proprities"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>请求参数</FormLabel>
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
                        <FormLabel>返回数据</FormLabel>
                        <FormControl>
                          <CodeEditor data={field.value} onUpdate={field.onChange} height={200} lineNumbers={2} />
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
