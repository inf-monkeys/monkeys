import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Download, Play, RefreshCw, Settings, Square } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// 训练状态枚举
const TRAINING_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
} as const;

// 模型类型枚举
const MODEL_TYPES = [
  { value: 'flux', label: 'Flux' },
  { value: 'lora', label: 'LoRA' },
] as const;

// 学习率验证函数
const validateLearningRate = (value: string) => {
  const scientificNotationRegex = /^\d+(\.\d+)?e-\d+$/i;
  if (!scientificNotationRegex.test(value)) {
    return '学习率必须是数字e-数字格式，如：2e-6 或 2.5e-6';
  }
  const num = parseFloat(value);
  if (num <= 0 || isNaN(num)) {
    return '学习率必须是大于0的有效数字';
  }
  return true;
};

// 表单验证schema
const trainingConfigSchema = z.object({
  fileStorageId: z.string().min(1, '请输入文件存储ID'),
  learningRate: z.string().refine(validateLearningRate, {
    message: '学习率必须是数字e-数字格式，如：2e-6 或 2.5e-6',
  }),
  modelName: z.string().min(1, '请输入模型名称'),
  modelType: z.enum(['flux', 'lora'], {
    message: '请选择模型类型',
  }),
  maxTrainEpochs: z.number().min(1, '训练轮数必须大于0'),
  trainBatchSize: z.number().min(1, '批次大小必须大于0'),
  saveEveryNEpochs: z.number().min(1, '保存间隔必须大于0'),
});

type TrainingConfigForm = z.infer<typeof trainingConfigSchema>;

interface IModelTrainingModuleProps {
  modelTrainingId: string;
}

export const ModelTrainingModule: React.FC<IModelTrainingModuleProps> = ({ modelTrainingId }) => {
  const [trainingStatus, setTrainingStatus] = useState<keyof typeof TRAINING_STATUS>('IDLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const form = useForm<TrainingConfigForm>({
    resolver: zodResolver(trainingConfigSchema),
    defaultValues: {
      fileStorageId: '',
      learningRate: '2e-6',
      modelName: '',
      modelType: undefined,
      maxTrainEpochs: 6,
      trainBatchSize: 1,
      saveEveryNEpochs: 2,
    },
  });

  // 刷新训练状态
  const refreshTrainingStatus = async () => {
    setIsRefreshing(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟随机状态
      const statuses = Object.keys(TRAINING_STATUS) as Array<keyof typeof TRAINING_STATUS>;
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setTrainingStatus(randomStatus);

      toast.success('训练状态已刷新');
    } catch (error) {
      toast.error('刷新训练状态失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 开始训练
  const startTraining = async () => {
    setIsTraining(true);
    setTrainingStatus('RUNNING');

    try {
      // 模拟训练过程
      setTimeout(() => {
        setTrainingStatus('COMPLETED');
        setIsTraining(false);
        toast.success('模型训练完成！');
      }, 5000);
    } catch (error) {
      setTrainingStatus('IDLE');
      setIsTraining(false);
      toast.error('训练失败');
    }
  };

  // 停止训练
  const stopTraining = () => {
    setTrainingStatus('IDLE');
    setIsTraining(false);
    toast.info('训练已停止');
  };

  // 下载模型
  const downloadModel = () => {
    toast.success('开始下载模型文件...');
  };

  // 提交训练配置
  const onSubmit = async (data: TrainingConfigForm) => {
    try {
      // 这里应该调用后端API保存配置
      console.log('训练配置:', data);

      // 验证学习率格式
      const learningRateRegex = /^\d+(\.\d+)?e-\d+$/i;
      if (!learningRateRegex.test(data.learningRate)) {
        toast.error('学习率格式不正确，请输入如 2e-6 或 2.5e-6 的格式');
        return;
      }

      toast.success('训练配置已保存');
    } catch (error) {
      toast.error('保存训练配置失败');
    }
  };

  const getStatusColor = (status: keyof typeof TRAINING_STATUS) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: keyof typeof TRAINING_STATUS) => {
    switch (status) {
      case 'IDLE':
        return '等待开始';
      case 'RUNNING':
        return '训练中';
      case 'COMPLETED':
        return '已完成';
      default:
        return '未知状态';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* 标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold">模型训练</h2>
          <p className="mt-2 text-muted-foreground">配置训练参数并开始模型训练过程</p>
        </div>

        {/* 训练状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                训练状态
              </div>
              <Button variant="outline" size="small" onClick={refreshTrainingStatus} loading={isRefreshing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新状态
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">当前状态：</span>
                <Badge className={`px-3 py-1 ${getStatusColor(trainingStatus)}`}>{getStatusText(trainingStatus)}</Badge>
              </div>
            </div>

            {/* 训练控制按钮 */}
            <div className="flex justify-center gap-2">
              {trainingStatus === 'IDLE' && (
                <Button onClick={startTraining} disabled={!form.formState.isValid}>
                  <Play className="mr-2 h-4 w-4" />
                  开始训练
                </Button>
              )}
              {trainingStatus === 'RUNNING' && (
                <Button variant="outline" onClick={stopTraining}>
                  <Square className="mr-2 h-4 w-4" />
                  停止训练
                </Button>
              )}
              {trainingStatus === 'COMPLETED' && (
                <Button onClick={downloadModel}>
                  <Download className="mr-2 h-4 w-4" />
                  下载模型
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 训练配置 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>训练配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fileStorageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>文件存储ID</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入文件存储ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learningRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>学习率设置</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="2e-6" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">格式：数字e-数字，如 2e-6, 2.5e-6, 1e-5 等</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>模型名称</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入模型名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>模型类型选择</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="选择模型类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODEL_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 高级设置 */}
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    高级设置
                  </Button>

                  {showAdvanced && (
                    <Card className="bg-muted/50">
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="maxTrainEpochs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>max_train_epochs</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="6" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="trainBatchSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>train_batch_size</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="saveEveryNEpochs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>save_every_n_epochs</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                <Button type="submit" className="w-full">
                  保存训练配置
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* 底部占位区域 */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};
