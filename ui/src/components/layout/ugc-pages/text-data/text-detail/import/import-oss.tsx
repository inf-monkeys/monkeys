import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUploadDocumentToKnowledgeBase } from '@/apis/vector';
import { IUploadDocument } from '@/apis/vector/typings.ts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox.tsx';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { PRE_PROCESS_RULES } from '@/schema/text-dataset/import-file.ts';
import { IImportFromOSS, importFromOSSSchema } from '@/schema/text-dataset/import-oss.ts';

interface IImportOSSProps {
  textId: string;
  children: React.ReactNode;
}

export const ImportOSS: React.FC<IImportOSSProps> = ({ children, textId }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { trigger } = useUploadDocumentToKnowledgeBase(textId);

  const form = useForm<IImportFromOSS>({
    resolver: zodResolver(importFromOSSSchema),
    defaultValues: {
      ossType: 'TOS',
      ossConfig: {},
      splitterType: 'auto-segment',
      splitterConfig: {},
    },
  });

  const [visible, setVisible] = useState(false);

  const handleSubmit = form.handleSubmit(({ splitterType, splitterConfig, ossType, ossConfig }) => {
    toast.promise(
      trigger({
        knowledgeBaseId: textId,
        ossType,
        ossConfig,
        splitterConfig,
        splitterType,
      } as IUploadDocument),
      {
        loading: t('ugc-page.text-data.detail.import.toast.create-task.loading'),
        success: () => {
          void mutate(`/api/vector/collections/${textId}/tasks`);
          setVisible(false);
          return t('ugc-page.text-data.detail.import.toast.create-task.success');
        },
        error: t('ugc-page.text-data.detail.import.toast.create-task.error'),
      },
    );
  });

  const { ossType, splitterType } = form.getValues();
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>从 OSS 导入</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <ScrollArea className="h-96 px-2 [&>div>div]:p-1">
              <FormField
                name="ossType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OSS 类型</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('ossConfig.region', val === 'TOS' ? 'cn-beijing' : void 0);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择 OSS 类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TOS">火山云 TOS</SelectItem>
                          <SelectItem value="ALIYUNOSS">阿里云对象存储</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ossType === 'TOS' && (
                <FormField
                  name="ossConfig.region"
                  control={form.control}
                  rules={{ required: '请输入 TOS 区域' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOS 区域</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入 TOS 区域，如 cn-beijing" {...field} className="grow" autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                name="ossConfig.endpoint"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OSS 端点</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入 OSS 端点，如 https://tos-cn-beijing.volces.com"
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>
                    <FormDescription>
                      示例端点：
                      {ossType === 'TOS' ? 'https://tos-cn-beijing.volces.com' : 'https://oss-cn-beijing.aliyuncs.com'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.bucketName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bucket Name</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入 Bucket Name" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.bucketType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bucket 类型</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('ossConfig.region', val === 'TOS' ? 'cn-beijing' : void 0);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择 OSS 类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">私有</SelectItem>
                          <SelectItem value="public">公开</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.accessKeyId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Key ID</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入 Access Key ID" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.accessKeySecret"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Key Secret</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入 Access Key Secret" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.baseFolder"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>文件所在目录路径</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入文件所在目录路径，如 folder/subfolder/"
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
                name="ossConfig.fileExtensions"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>文件后缀</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入文件后缀" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormDescription>
                      如果有多种类型，使用逗号分割，如 .txt .pdf。不传则表示导入所有类型的文件
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="ossConfig.excludeFileRegex"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>过滤文件正则表达式</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入过滤文件正则表达式" {...field} className="grow" autoFocus />
                    </FormControl>
                    <FormDescription>根据正则表达式过滤特定的文件，如 \(已取消\)|（已取消）|（更新前）</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

              <FormField
                name="splitterType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分段清洗配置</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === 'custom-segment') {
                            form.setValue('splitterConfig.separator', '\n\n');
                            form.setValue('splitterConfig.chunk_size', 500);
                            form.setValue('splitterConfig.chunk_overlap', 50);
                            form.setValue('preProcessRules', []);
                          } else {
                            form.setValue('splitterConfig', {});
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个分段清洗模式" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto-segment">自动分段清洗</SelectItem>
                          <SelectItem value="custom-segment">自定义分段清洗</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {splitterType === 'auto-segment'
                        ? '自动设置分段规则与预处理规则，如果不了解这些参数建议选择此项'
                        : '自定义分段规则、分段长度以及预处理规则等参数'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {splitterType === 'custom-segment' && (
                <>
                  <FormField
                    name="splitterConfig.separator"
                    control={form.control}
                    rules={{ required: '请输入分段标识符' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>分段标识符</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="请输入分段标识符，如：「，」、「。」、「,」、「\n」"
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
                    name="splitterConfig.chunk_size"
                    control={form.control}
                    rules={{ required: '请输入分段最大长度' }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>分段最大长度</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="500"
                            value={value?.toString()}
                            onChange={(val) => onChange(Number(val))}
                            className="grow"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="splitterConfig.chunk_overlap"
                    control={form.control}
                    rules={{ required: '请输入文本重叠量' }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>文本重叠量</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="50"
                            value={value?.toString()}
                            onChange={(val) => onChange(Number(val))}
                            className="grow"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="preProcessRules"
                    control={form.control}
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>{t('ugc-page.text-data.detail.import.utils.pre-process.rules.label')}</FormLabel>
                        </div>
                        {PRE_PROCESS_RULES.map((value) => (
                          <FormField
                            key={value}
                            control={form.control}
                            name="preProcessRules"
                            render={({ field }) => {
                              return (
                                <FormItem key={value} className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange(field.value ? [...field.value, value] : [value])
                                          : field.onChange(field.value?.filter((it) => it !== value));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {t(`ugc-page.text-data.detail.import.utils.pre-process.rules.rules.${value}`)}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" type="submit">
                提交
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
