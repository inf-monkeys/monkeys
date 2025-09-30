import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import * as z from 'zod';

import { createVRTask } from '@/apis/ugc/vr-evaluation';
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

interface CreateVRTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const createVRTaskSchema = z.object({
  taskName: z.string().min(1, '请输入任务名称'),
  modelUrl: z.string().url('请输入有效的 URL').min(1, '请输入模型文件链接'),
  thumbnailUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

type CreateVRTaskFormData = z.infer<typeof createVRTaskSchema>;

export const CreateVRTaskDialog: React.FC<CreateVRTaskDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateVRTaskFormData>({
    resolver: zodResolver(createVRTaskSchema),
    defaultValues: {
      taskName: '',
      modelUrl: '',
      thumbnailUrl: '',
    },
  });

  const onSubmit = async (data: CreateVRTaskFormData) => {
    setLoading(true);
    try {
      await createVRTask({
        taskName: data.taskName,
        modelUrl: data.modelUrl,
        thumbnailUrl: data.thumbnailUrl || undefined,
      });

      toast.success('VR 评测任务创建成功');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create VR task:', error);
      toast.error('创建 VR 评测任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建 VR 评测任务</DialogTitle>
          <DialogDescription>创建一个虚拟现实环境中的 3D 模型评测任务</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：一个家用扫地机器人" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模型文件链接 (USDZ) *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/model.usdz" {...field} />
                  </FormControl>
                  <FormDescription>支持 USDZ 格式的 3D 模型文件，可在 Vision Pro 中查看</FormDescription>
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
