import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUploadDocumentToVectorCollection } from '@/apis/vector';
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
import { Updater } from '@/components/ui/updater';
import { IImportFile, importFileSchema, PRE_PROCESS_RULES } from '@/schema/text-dataset/import-file.ts';

interface IImportFileProps {
  children?: React.ReactNode;
  textId: string;
}

export const ImportFile: React.FC<IImportFileProps> = ({ children, textId }) => {
  const { mutate } = useSWRConfig();
  const { trigger } = useUploadDocumentToVectorCollection(textId);

  const form = useForm<IImportFile>({
    resolver: zodResolver(importFileSchema),
    defaultValues: {
      fileURL: '',
      split: {
        splitType: 'auto-segment',
        params: {},
      },
    },
  });

  const [visible, setVisible] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    toast.promise(trigger({ collectionName: textId, ...data } as IUploadDocument), {
      loading: '正在创建导入文档任务...',
      success: () => {
        setVisible(false);
        void mutate(`/api/vector/collections/${textId}/tasks`);
        return '文档导入任务创建成功';
      },
      error: '文档导入任务创建失败',
    });
  });

  const {
    split: { splitType },
  } = form.getValues();

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>导入文档</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <ScrollArea className="h-80 px-2 [&>div>div]:p-1">
              <FormField
                name="fileURL"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Updater
                        accept={[
                          'text/plain',
                          'application/pdf',
                          'text/csv',
                          'application/json',
                          'application/ld+json',
                          'application/zip',
                        ]}
                        maxSize={400}
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
                name="split.splitType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分段清洗配置</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === 'custom-segment') {
                            form.setValue('split.params.segmentParams.segmentSymbol', '\n');
                            form.setValue('split.params.segmentParams.segmentMaxLength', 1000);
                            form.setValue('split.params.segmentParams.segmentChunkOverlap', 10);
                            form.setValue('split.params.preProcessRules', []);
                          } else {
                            form.setValue('split.params', {});
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
                      {splitType === 'auto-segment'
                        ? '自动设置分段规则与预处理规则，如果不了解这些参数建议选择此项'
                        : '自定义分段规则、分段长度以及预处理规则等参数'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {splitType === 'custom-segment' && (
                <>
                  <FormField
                    name="split.params.segmentParams.segmentSymbol"
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
                    name="split.params.segmentParams.segmentMaxLength"
                    control={form.control}
                    rules={{ required: '请输入分段最大长度' }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>分段最大长度</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1000"
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
                    name="split.params.segmentParams.segmentChunkOverlap"
                    control={form.control}
                    rules={{ required: '请输入文本重叠量' }}
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>文本重叠量</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10"
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
                    name="split.params.preProcessRules"
                    control={form.control}
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>文本预处理规则</FormLabel>
                        </div>
                        {PRE_PROCESS_RULES.map(({ value, label }) => (
                          <FormField
                            key={value}
                            control={form.control}
                            name="split.params.preProcessRules"
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
                                  <FormLabel className="text-sm font-normal">{label}</FormLabel>
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
