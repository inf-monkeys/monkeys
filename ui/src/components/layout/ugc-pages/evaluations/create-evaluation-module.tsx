import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import * as z from 'zod';

import { createEvaluationModule } from '@/apis/evaluation';
import { CreateEvaluationModuleDto } from '@/apis/evaluation/typings';
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

interface CreateEvaluationModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const createEvaluationModuleSchema = z.object({
  displayName: z.string().min(1, '请输入评测模块名称'),
  description: z.string().optional(),
  evaluationCriteria: z.string().optional(),
});

type CreateEvaluationModuleFormData = z.infer<typeof createEvaluationModuleSchema>;

export const CreateEvaluationModuleDialog: React.FC<CreateEvaluationModuleDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateEvaluationModuleFormData>({
    resolver: zodResolver(createEvaluationModuleSchema),
    defaultValues: {
      displayName: '',
      description: '',
      evaluationCriteria: '',
    },
  });

  const onSubmit = async (data: CreateEvaluationModuleFormData) => {
    setLoading(true);
    try {
      const payload: CreateEvaluationModuleDto = {
        displayName: data.displayName,
        description: data.description || undefined,
        evaluationCriteria: data.evaluationCriteria || undefined,
      };

      console.log('Creating evaluation module with payload:', payload);
      const result = await createEvaluationModule(payload);
      console.log('Creation result:', result);

      toast.success('评测模块创建成功');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create evaluation module:', error);
      toast.error('创建评测模块失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建评测模块</DialogTitle>
          <DialogDescription>创建一个新的评测模块来管理和评估您的资产</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模块名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入评测模块名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入评测模块的描述信息" rows={3} {...field} />
                  </FormControl>
                  <FormDescription>简要描述这个评测模块的用途和目标</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluationCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>评测标准</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入评测标准，如：美观度、实用性、创新性等" rows={3} {...field} />
                  </FormControl>
                  <FormDescription>定义评测的具体标准和维度</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t('common.utils.cancel')}
              </Button>
              <Button type="submit" loading={loading}>
                {t('common.utils.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
