import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Edit, Pause, Play, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { deleteModelTraining, updateModelTraining } from '@/apis/model-training';
import { IModelTraining } from '@/apis/model-training/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface IModelTrainingDetailContentProps {
  modelTraining: IAssetItem<IModelTraining>;
  modelTrainingId: string;
}

const editModelTrainingSchema = z.object({
  displayName: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
});

type EditModelTrainingForm = z.infer<typeof editModelTrainingSchema>;

export const ModelTrainingDetailContent: React.FC<IModelTrainingDetailContentProps> = ({
  modelTraining,
  modelTrainingId,
}) => {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditModelTrainingForm>({
    resolver: zodResolver(editModelTrainingSchema),
    defaultValues: {
      displayName: modelTraining.displayName as string,
      description: (modelTraining.description as string) || '',
    },
  });

  const handleEdit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await updateModelTraining(modelTrainingId, {
        displayName: data.displayName,
        description: data.description,
      });
      toast.success('模型训练更新成功');
      setEditDialogOpen(false);
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/model-training'));
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setIsLoading(false);
    }
  });

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteModelTraining(modelTrainingId);
      toast.success('模型训练删除成功');
      setDeleteDialogOpen(false);
      // 这里应该导航回列表页面
      window.history.back();
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTraining = () => {
    // TODO: 实现开始训练逻辑
    toast.info('开始训练功能待实现');
  };

  const handlePauseTraining = () => {
    // TODO: 实现暂停训练逻辑
    toast.info('暂停训练功能待实现');
  };

  const handleStopTraining = () => {
    // TODO: 实现停止训练逻辑
    toast.info('停止训练功能待实现');
  };

  const handleDownloadModel = () => {
    // TODO: 实现下载模型逻辑
    toast.info('下载模型功能待实现');
  };

  const canStart = modelTraining.status === 'idle' || modelTraining.status === 'failed';
  const canPause = modelTraining.status === 'running';
  const canStop = modelTraining.status === 'running' || modelTraining.status === 'pending';
  const canDownload = modelTraining.status === 'completed';

  return (
    <div className="col-span-2 space-y-4">
      {/* 操作按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {canStart && (
              <Button onClick={handleStartTraining} icon={<Play />} size="small">
                开始训练
              </Button>
            )}
            {canPause && (
              <Button onClick={handlePauseTraining} icon={<Pause />} size="small" variant="outline">
                暂停训练
              </Button>
            )}
            {canStop && (
              <Button onClick={handleStopTraining} icon={<RotateCcw />} size="small" variant="outline">
                停止训练
              </Button>
            )}
            {canDownload && (
              <Button onClick={handleDownloadModel} icon={<Download />} size="small" variant="outline">
                下载模型
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="small" icon={<Edit />}>
                  编辑
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑模型训练</DialogTitle>
                  <DialogDescription>修改模型训练的名称和描述信息</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={handleEdit} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>名称</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit" loading={isLoading}>
                        保存
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/*<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>*/}
            {/*  <DialogTrigger asChild>*/}
            {/*    <Button variant="outline" size="small" icon={<Trash2 />}>*/}
            {/*      删除*/}
            {/*    </Button>*/}
            {/*  </DialogTrigger>*/}
            {/*  <DialogContent>*/}
            {/*    <DialogHeader>*/}
            {/*      <DialogTitle>确认删除</DialogTitle>*/}
            {/*      <DialogDescription>确定要删除这个模型训练吗？此操作不可撤销。</DialogDescription>*/}
            {/*    </DialogHeader>*/}
            {/*    <DialogFooter>*/}
            {/*      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>*/}
            {/*        取消*/}
            {/*      </Button>*/}
            {/*      <Button variant="destructive" onClick={handleDelete} loading={isLoading}>*/}
            {/*        删除*/}
            {/*      </Button>*/}
            {/*    </DialogFooter>*/}
            {/*  </DialogContent>*/}
            {/*</Dialog>*/}
          </div>
        </CardContent>
      </Card>

      {/* 训练信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">训练信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">状态：</span>
              <Badge
                variant={
                  modelTraining.status === 'completed'
                    ? 'default'
                    : modelTraining.status === 'running'
                      ? 'secondary'
                      : modelTraining.status === 'failed'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {modelTraining.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">创建者：</span>
              <span>{modelTraining.user?.name || '未知'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 训练进度 */}
      {modelTraining.status === 'running' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">训练进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>0%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: '0%' }}></div>
              </div>
              <p className="text-sm text-muted-foreground">训练进行中，请稍候...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 训练结果 */}
      {modelTraining.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">训练结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-green-600">✅ 训练已完成</p>
              <p className="text-muted-foreground">模型已成功训练完成，可以下载使用。</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {modelTraining.status === 'failed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">训练失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-red-600">❌ 训练失败</p>
              <p className="text-muted-foreground">训练过程中出现错误，请检查配置后重试。</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
