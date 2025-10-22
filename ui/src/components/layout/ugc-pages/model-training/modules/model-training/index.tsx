import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Clock, Download, Play, RefreshCw, Settings, Square, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { vinesHeader } from '@/apis/utils';
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
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// 训练状态枚举
const TRAINING_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
} as const;

// 数据上传任务状态接口
interface UploadTaskStatus {
  model_training_id: string;
  total_count: number;
  done_count: number;
  state: number | null;
  result: any;
  error: string | null;
  updated_time: string | null;
  dataset_id: string | null;
  path_suffix: string | null;
}

// 模型类型枚举（展示为 Flux Dreambooth / Flux LoRA，提交仍使用原有取值）
const MODEL_TYPES = [
  { value: 'flux', label: 'Flux Dreambooth' },
  { value: 'lora', label: 'Flux LoRA' },
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
  maxTrainEpochs: z.coerce.number().min(1, '训练轮数必须大于0'),
  trainBatchSize: z.coerce.number().min(1, '批次大小必须大于0'),
  saveEveryNEpochs: z.coerce.number().min(1, '保存间隔必须大于0'),
});

type TrainingConfigForm = z.infer<typeof trainingConfigSchema>;

interface IModelTrainingModuleProps {
  modelTrainingId: string;
  displayName?: string; // 页面显示名称，用于作为默认模型名称
}

export const ModelTrainingModule: React.FC<IModelTrainingModuleProps> = ({ modelTrainingId, displayName }) => {
  const [trainingStatus, setTrainingStatus] = useState<keyof typeof TRAINING_STATUS>('IDLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // 数据上传任务状态
  const [uploadTaskStatus, setUploadTaskStatus] = useState<UploadTaskStatus | null>(null);
  const [isLoadingUploadTask, setIsLoadingUploadTask] = useState(false);

  // 停止训练确认弹窗状态
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [isStoppingTraining, setIsStoppingTraining] = useState(false);

  const form = useForm<TrainingConfigForm>({
    resolver: zodResolver(trainingConfigSchema),
    defaultValues: {
      fileStorageId: modelTrainingId, // 默认使用模型训练ID
      learningRate: '2e-6',
      modelName: displayName || '',
      modelType: undefined,
      maxTrainEpochs: 6,
      trainBatchSize: 1,
      saveEveryNEpochs: 2,
    },
  });

  // 获取数据上传任务状态
  const fetchUploadTaskStatus = async () => {
    setIsLoadingUploadTask(true);
    try {
      const response = await fetch(`/api/model-training/upload-task-status/${modelTrainingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setUploadTaskStatus(result.data);
      } else {
        throw new Error(result.message || '获取数据上传任务状态失败');
      }
    } catch (error) {
      // console.error('获取数据上传任务状态失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟数据上传任务状态
        setUploadTaskStatus({
          model_training_id: modelTrainingId,
          total_count: 3,
          done_count: 2,
          state: -1,
          result: null,
          error: null,
          updated_time: new Date().toISOString(),
          dataset_id: '1759074730',
          path_suffix: '1759074730/100_1',
        });
        return;
      }

      toast.error(`获取数据上传任务状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingUploadTask(false);
    }
  };

  // 获取训练配置
  const fetchTrainingConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch('/api/model-training/get-training-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: modelTrainingId,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('获取训练配置API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        const config = result.data;

        // 更新表单值
        form.reset({
          fileStorageId: config.fileStorageId || modelTrainingId,
          learningRate: config.learningRate || '2e-6',
          // 如果后端未返回 modelName，默认使用页面显示名称
          modelName: config.modelName || displayName || '',
          modelType: config.modelTrainingType || undefined,
          maxTrainEpochs: config.maxTrainEpochs || 6,
          trainBatchSize: config.trainBatchSize || 1,
          saveEveryNEpochs: config.saveEveryNEpochs || 2,
        });

        toast.success('训练配置加载成功');
      } else {
        throw new Error(result.message || '获取训练配置失败');
      }
    } catch (error) {
      // console.error('获取训练配置失败:', error);

      // 如果是连接错误，在开发模式下使用默认值
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用默认配置进行开发测试');

        // 使用默认值
        form.reset({
          fileStorageId: modelTrainingId,
          learningRate: '2e-6',
          modelName: displayName || '',
          modelType: undefined,
          maxTrainEpochs: 6,
          trainBatchSize: 1,
          saveEveryNEpochs: 2,
        });

        toast.success('使用默认训练配置（开发模式）');
        return;
      }

      toast.error(`获取训练配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // 组件挂载时获取配置、数据上传任务状态和训练状态
  React.useEffect(() => {
    fetchTrainingConfig();
    fetchUploadTaskStatus();
    refreshTrainingStatus();
  }, [modelTrainingId]);

  // 刷新训练状态
  const refreshTrainingStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/model-training/training-status/${modelTrainingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '获取训练状态失败');
      }

      const result = await response.json();

      if (result.code === 200) {
        const trainingData = result.data;

        // 根据外部API返回的状态更新本地状态
        switch (trainingData.status) {
          case '2':
            setTrainingStatus('RUNNING');
            break;
          case '-1':
            setTrainingStatus('COMPLETED');
            break;
          case '-3':
            setTrainingStatus('STOPPED');
            break;
          case '-4':
          case 'not_found':
            setTrainingStatus('IDLE');
            break;
          default:
            setTrainingStatus('IDLE');
        }

        toast.success('训练状态已刷新');
      } else {
        throw new Error(result.message || '获取训练状态失败');
      }
    } catch (error) {
      // console.error('刷新训练状态失败:', error);
      toast.error(`刷新训练状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 开始训练
  const startTraining = async () => {
    setIsTraining(true);

    try {
      const response = await fetch('/api/model-training/start-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          model_training_id: modelTrainingId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '训练启动失败');
      }

      const result = await response.json();

      if (result.code === 200) {
        setTrainingStatus('RUNNING');
        toast.success('模型训练已开始！');

        // 同步调用刷新状态
        setTimeout(() => {
          refreshTrainingStatus();
        }, 1000);
      } else {
        throw new Error(result.message || '训练启动失败');
      }
    } catch (error) {
      // console.error('开始训练失败:', error);
      toast.error(`开始训练失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTraining(false);
    }
  };

  // 停止训练
  const stopTraining = () => {
    setShowStopConfirmDialog(true);
  };

  // 确认停止训练
  const confirmStopTraining = async () => {
    setIsStoppingTraining(true);

    try {
      const response = await fetch('/api/model-training/stop-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          model_training_id: modelTrainingId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '停止训练失败');
      }

      const result = await response.json();

      if (result.code === 200) {
        setShowStopConfirmDialog(false);
        toast.success('训练已成功停止！');

        // 延迟刷新状态，获取最新的训练状态
        setTimeout(() => {
          refreshTrainingStatus();
        }, 1000);
      } else {
        throw new Error(result.message || '停止训练失败');
      }
    } catch (error) {
      // console.error('停止训练失败:', error);
      toast.error(`停止训练失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsStoppingTraining(false);
    }
  };

  // 下载模型
  const downloadModel = () => {
    toast.success('开始下载模型文件...');
  };

  // 提交训练配置
  const onSubmit = async (data: TrainingConfigForm) => {
    try {
      // 调用真实的后端API保存训练配置
      const response = await fetch('/api/model-training/save-training-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: modelTrainingId,
          learning_rate: data.learningRate,
          max_train_epochs: data.maxTrainEpochs,
          train_batch_size: data.trainBatchSize,
          save_every_n_epochs: data.saveEveryNEpochs,
          model_training_type: data.modelType,
          model_name: data.modelName,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('保存训练配置API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 检查返回的success值
        const isSuccess = result.data.success;
        const message = result.data.message || '训练配置保存完成';

        if (isSuccess) {
          toast.success(message);
        } else {
          toast.error(`保存失败: ${message}`);
        }
      } else {
        throw new Error(result.message || '保存训练配置失败');
      }
    } catch (error) {
      // console.error('保存训练配置失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟保存成功
        toast.success('训练配置已保存（开发模式）');
        return;
      }

      toast.error(`保存训练配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const getStatusColor = (status: keyof typeof TRAINING_STATUS) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'STOPPED':
        return 'bg-red-100 text-red-800';
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
      case 'STOPPED':
        return '已停止';
      default:
        return '未知状态';
    }
  };

  // 获取数据上传任务状态显示文本
  const getUploadTaskStatusText = (state: number | null) => {
    if (state === null) return '无任务';
    // @ts-ignore
    if (state === -1 || state === '-1') return '已完成';
    // @ts-ignore
    if (state === 0 || state === '0') return '等待中';
    // @ts-ignore
    if (state === 1 || state === '1') return '执行中';
    return `状态: ${state}`;
  };

  // 获取数据上传任务状态颜色
  const getUploadTaskStatusColor = (state: number | null) => {
    if (state === null) return 'bg-gray-100 text-gray-800';
    // @ts-ignore
    if (state === -1 || state === '-1') return 'bg-green-100 text-green-800';
    // @ts-ignore
    if (state === 0 || state === '0') return 'bg-yellow-100 text-yellow-800';
    // @ts-ignore
    if (state === 1 || state === '1') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
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
                <Button onClick={startTraining} disabled={isTraining}>
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
              {trainingStatus === 'STOPPED' && (
                <Button onClick={startTraining} disabled={isTraining}>
                  <Play className="mr-2 h-4 w-4" />
                  重新开始训练
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 数据上传进度任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                数据上传进度任务
              </div>
              <Button variant="outline" size="small" onClick={fetchUploadTaskStatus} loading={isLoadingUploadTask}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新状态
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadTaskStatus ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">任务状态：</span>
                    <Badge className={`px-3 py-1 ${getUploadTaskStatusColor(uploadTaskStatus.state)}`}>
                      {getUploadTaskStatusText(uploadTaskStatus.state)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">进度：</span>
                    <span className="text-sm font-medium">
                      {uploadTaskStatus.done_count} / {uploadTaskStatus.total_count}
                    </span>
                  </div>
                </div>

                {uploadTaskStatus.total_count > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">任务进度</span>
                      <span className="font-medium">
                        {Math.round((uploadTaskStatus.done_count / uploadTaskStatus.total_count) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${(uploadTaskStatus.done_count / uploadTaskStatus.total_count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {uploadTaskStatus.dataset_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">数据集ID：</span>
                    <span className="text-sm font-medium">{uploadTaskStatus.dataset_id}</span>
                  </div>
                )}

                {uploadTaskStatus.path_suffix && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">路径后缀：</span>
                    <span className="text-sm font-medium">{uploadTaskStatus.path_suffix}</span>
                  </div>
                )}

                {uploadTaskStatus.updated_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">更新时间：</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(uploadTaskStatus.updated_time).toLocaleString()}
                    </div>
                  </div>
                )}

                {uploadTaskStatus.error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-800">错误信息：</span>
                    </div>
                    <p className="mt-1 text-sm text-red-700">{uploadTaskStatus.error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>暂无数据上传任务</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 训练配置 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>训练配置</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    onClick={fetchTrainingConfig}
                    loading={isLoadingConfig}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新配置
                  </Button>
                </CardTitle>
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
                          <Input
                            placeholder="文件存储ID"
                            {...field}
                            disabled
                            className="cursor-not-allowed bg-muted/50"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">文件存储ID自动设置为当前模型训练ID，不可修改</p>
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

      {/* 停止训练确认弹窗 */}
      <Dialog open={showStopConfirmDialog} onOpenChange={setShowStopConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认停止训练</DialogTitle>
            <DialogDescription>您确定要停止当前的模型训练吗？停止后训练进度将丢失，无法恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopConfirmDialog(false)} disabled={isStoppingTraining}>
              取消
            </Button>
            <Button variant="outline" onClick={confirmStopTraining} loading={isStoppingTraining}>
              确认停止
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
