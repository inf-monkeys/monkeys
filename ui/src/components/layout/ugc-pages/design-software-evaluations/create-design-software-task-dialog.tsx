import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import * as z from 'zod';

import { createDesignSoftwareTask } from '@/apis/ugc/design-software-evaluation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateDesignSoftwareTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const createDesignSoftwareTaskSchema = z.object({
  softwareName: z.string().min(1, '请输入软件名称'),
  softwareVersion: z.string().optional(),
  taskDescription: z.string().min(1, '请输入测评描述'),
  thumbnailUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  documentUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

type CreateDesignSoftwareTaskFormData = z.infer<typeof createDesignSoftwareTaskSchema>;

export const CreateDesignSoftwareTaskDialog: React.FC<CreateDesignSoftwareTaskDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateDesignSoftwareTaskFormData>({
    resolver: zodResolver(createDesignSoftwareTaskSchema),
    defaultValues: {
      softwareName: '',
      softwareVersion: '',
      taskDescription: '',
      thumbnailUrl: '',
      documentUrl: '',
    },
  });

  const onSubmit = async (data: CreateDesignSoftwareTaskFormData) => {
    setLoading(true);
    try {
      await createDesignSoftwareTask({
        softwareName: data.softwareName,
        softwareVersion: data.softwareVersion || undefined,
        taskDescription: data.taskDescription,
        thumbnailUrl: data.thumbnailUrl || undefined,
        documentUrl: data.documentUrl || undefined,
      });

      toast.success('设计软件测评任务创建成功');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create design software task:', error);
      toast.error('创建设计软件测评任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>创建设计软件测评任务</DialogTitle>
          <DialogDescription>创建一个针对设计软件的综合测评任务</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="softwareName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>软件名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：Figma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="softwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>软件版本（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：v2023.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="taskDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>测评描述 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述本次测评的目标、范围和重点..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>详细说明本次测评的具体内容和评估标准</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>缩略图链接（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>相关文档链接（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/document.pdf" {...field} />
                  </FormControl>
                  <FormDescription>可以是软件说明文档、测评指南等</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t('common.utils.cancel')}
              </Button>
              <Button type="submit" variant="outline" loading={loading}>
                {t('common.utils.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
