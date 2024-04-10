import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateVectorCollection, useVectorSupportedEmbeddingModels } from '@/apis/vector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { datasetInfoSchema, IDatasetInfo } from '@/schema/text-dataset';

interface ICreateDatasetProps {}

export const CreateDataset: React.FC<ICreateDatasetProps> = () => {
  const { mutate } = useSWRConfig();

  const { data: embeddingModels } = useVectorSupportedEmbeddingModels();
  const { trigger } = useCreateVectorCollection();

  const form = useForm<IDatasetInfo>({
    resolver: zodResolver(datasetInfoSchema),
    defaultValues: {
      iconUrl: 'emoji:🍀:#ceefc5',
    },
  });

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    setIsLoading(true);
    toast.promise(trigger(data), {
      loading: '正在创建数据集...',
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/vector/collections'));
        return '数据集创建成功';
      },
      error: '数据集创建失败',
      finally: () => {
        setIsLoading(false);
        setOpen(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          创建数据集
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>创建文本数据</DialogTitle>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>知识库名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入知识库名称" {...field} className="grow" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="embeddingModel"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embedding 模型</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择一个模型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {embeddingModels?.map((it, i) => (
                          <SelectItem value={it.name} key={i} disabled={!it.enabled}>
                            {it.displayName}
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
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数据集简介</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入数据集简介，不超过 100 字" className="h-28 resize-none" {...field} />
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
                  <FormLabel>数据集图标</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} defaultValue="emoji:🍀:#ceefc5" onChange={field.onChange} />
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
