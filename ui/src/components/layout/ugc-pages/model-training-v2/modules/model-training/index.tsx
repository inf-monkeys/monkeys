import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import ReactECharts from 'echarts-for-react';
import { Brain, Download, Maximize2, Play, RefreshCw, Settings, Square, TestTube } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useGetPretrainedModels } from '@/apis/model-training';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// 训练日志分析结果接口
interface TrainingLogAnalysis {
  model_training_id: string;
  log_file_path: string;
  analysis_result: {
    status: string;
    message: string;
    progress_data?: {
      percent: string;
      current_step: string;
      total_step: string;
      elapsed_time: string;
      remaining_time: string;
      avr_loss: string;
      full_line: string;
    } | null;
    error_found: boolean;
  };
}

// TensorBoard分析结果接口
interface TensorboardDataPoint {
  step: number;
  value: number;
  time: number;
}

interface TensorboardAnalysisResult {
  'loss/average'?: TensorboardDataPoint[];
  loss?: TensorboardDataPoint[];
  'lr/unet': TensorboardDataPoint[];
}

interface TensorboardTrainingType {
  timestamp: number;
  event_file_path: string;
  analysis_result: TensorboardAnalysisResult;
}

interface TensorboardAnalysisResults {
  lora: TensorboardTrainingType;
}

interface TensorboardAnalysis {
  model_training_id: string;
  base_path: string;
  max_timestamp: number;
  training_type: string;
  analysis_results: TensorboardAnalysisResults;
}

// 训练状态枚举
const TRAINING_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
} as const;

// 模型类型枚举（仅支持 Flux Lora）
const MODEL_TYPES = [{ value: 'lora', label: 'Flux Lora' }] as const;

// 底模选择枚举（已废弃，现在从API动态获取）
// const PRETRAINED_MODELS = [
//   { value: 'flux1-dev_unet.safetensors', label: 'flux1-dev_unet.safetensors' },
// ] as const;

// 学习率验证函数 - 格式：数字e-数字（如：2e-5, 2.5e-6）
const validateLearningRate = (value: string) => {
  // 检查是否为空
  if (!value || value.trim() === '') {
    return '请输入学习率';
  }

  // 验证格式：数字e-数字（支持小数，如 2e-5 或 2.5e-6）
  const scientificNotationRegex = /^\d+(\.\d+)?e-\d+$/i;
  if (!scientificNotationRegex.test(value.trim())) {
    return '格式不正确，需要数字e-数字格式（如：2e-5 或 2.5e-6）';
  }

  // 验证数值是否大于0
  const num = parseFloat(value);
  if (num <= 0 || isNaN(num)) {
    return '学习率必须是大于0的有效数字';
  }

  return true;
};

// 表单验证schema
const trainingConfigSchema = z
  .object({
    fileStorageId: z.string().min(1, '请输入文件存储ID'),
    learningRate: z.string().refine(validateLearningRate, {
      message: '学习率必须是数字e-数字格式，如：2e-6 或 2.5e-6',
    }),
    unetLearningRate: z.string().refine(validateLearningRate, {
      message: '网络学习率必须是数字e-数字格式，如：2e-6 或 2.5e-6',
    }),
    textEncoderLr: z.string().refine(validateLearningRate, {
      message: '文本学习率必须是数字e-数字格式，如：2e-6 或 2.5e-6',
    }),
    modelName: z.string().min(1, '请输入模型名称'),
    modelType: z.union([z.string(), z.undefined()]).refine((val) => val === 'lora', {
      message: '请选择模型类型',
    }),
    repeat: z.coerce.number().min(1, '样本重复次数必须大于0'),
    maxTrainEpochs: z.coerce.number().min(1, '训练轮数必须大于0'),
    trainBatchSize: z.coerce.number().min(1, '批次大小必须大于0'),
    saveEveryNEpochs: z.coerce.number().min(1, '保存间隔必须大于0'),
    networkDim: z.coerce.number().min(1, '网络维度必须大于0'),
    networkAlpha: z.coerce.number().min(1, '网络缩放因子必须大于0'),
    pretrainedModel: z.string().min(1, '请选择底模'),
    testSetMode: z.enum(['number', 'custom']).optional(),
    testSetNumber: z.union([z.coerce.number().min(1).max(10), z.undefined()]).optional(),
    testSetCustom: z.array(z.string()).max(10).optional(),
  })
  .refine(
    (data) => {
      // 如果 testSetMode 是 'number'，则 testSetNumber 必须存在且有效
      if (data.testSetMode === 'number') {
        if (data.testSetNumber === undefined || data.testSetNumber === null || isNaN(data.testSetNumber)) {
          return false;
        }
        if (data.testSetNumber < 1 || data.testSetNumber > 10) {
          return false;
        }
      }
      return true;
    },
    {
      message: '测试集条数必须在1-10之间',
      path: ['testSetNumber'],
    },
  );

type TrainingConfigForm = z.infer<typeof trainingConfigSchema>;

interface IModelTrainingModuleProps {
  modelTrainingId: string;
  displayName?: string; // 页面显示名称，用于作为默认模型名称
  onNavigateToTest?: () => void; // 跳转到模型测试页面的回调
}

export const ModelTrainingModule: React.FC<IModelTrainingModuleProps> = ({ modelTrainingId, displayName, onNavigateToTest }) => {
  // 获取底模列表
  const { data: pretrainedModels = [], isLoading: isLoadingPretrainedModels } = useGetPretrainedModels('2');

  // 捕获未处理的验证错误
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 如果是 Zod 验证错误，捕获并显示 toast
      if (event.reason?.name === 'ZodError' || event.reason?.issues) {
        event.preventDefault();
        const errors = event.reason?.issues || [];
        if (errors.length > 0) {
          const errorMessages = errors.map((err: any) => {
            const fieldName = err.path?.join('.') || '字段';
            return `${fieldName}: ${err.message || '验证失败'}`;
          });
          const toastMessage =
            errorMessages.length === 1
              ? errorMessages[0]
              : `请检查并填写以下必填项：${errorMessages.slice(0, 3).join('、')}${errorMessages.length > 3 ? '等' : ''}`;
          toast.error(toastMessage);
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const [trainingStatus, setTrainingStatus] = useState<keyof typeof TRAINING_STATUS>('IDLE');
  const [rawTrainingStatus, setRawTrainingStatus] = useState<string>('not_found'); // 保存原始的训练状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // 训练日志分析状态
  const [trainingLogAnalysis, setTrainingLogAnalysis] = useState<TrainingLogAnalysis | null>(null);
  const [isLoadingLogAnalysis, setIsLoadingLogAnalysis] = useState(false);

  // TensorBoard分析状态
  const [tensorboardAnalysis, setTensorboardAnalysis] = useState<TensorboardAnalysis | null>(null);
  const [isLoadingTensorboard, setIsLoadingTensorboard] = useState(false);

  // 图表放大状态
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [currentChartType, setCurrentChartType] = useState<'loss' | 'lr'>('loss');

  // 停止训练确认弹窗状态
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [isStoppingTraining, setIsStoppingTraining] = useState(false);

  const form = useForm<TrainingConfigForm>({
    resolver: zodResolver(trainingConfigSchema),
    mode: 'onSubmit', // 只在提交时验证
    reValidateMode: 'onSubmit', // 重新验证时也只在提交时验证
    defaultValues: {
      fileStorageId: modelTrainingId, // 默认使用模型训练ID
      learningRate: '2e-5',
      unetLearningRate: '2e-6',
      textEncoderLr: '2e-6',
      modelName: displayName || '',
      modelType: undefined, // 不设置默认值，需要手动选择
      repeat: 100,
      maxTrainEpochs: 6,
      trainBatchSize: 1,
      saveEveryNEpochs: 2,
      networkDim: 128,
      networkAlpha: 2,
      pretrainedModel: '', // 默认值将在获取到列表后设置
      testSetMode: 'number',
      testSetNumber: 4,
      testSetCustom: [],
    },
  });

  // 获取TensorBoard分析
  const fetchTensorboardAnalysis = async () => {
    setIsLoadingTensorboard(true);
    try {
      const response = await fetch('/api/model-training/analyze-tensorboard', {
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
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        // console.log('TensorBoard分析数据:', result.data);
        setTensorboardAnalysis(result.data);
        // toast.success('TensorBoard分析数据获取成功');
      } else {
        throw new Error(result.message || '获取TensorBoard分析失败');
      }
    } catch (error) {
      // console.error('获取TensorBoard分析失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟TensorBoard分析数据
        setTensorboardAnalysis({
          model_training_id: modelTrainingId,
          base_path: '/root/data-local/dataset/log/model_training',
          max_timestamp: 20251024135227,
          training_type: 'lora',
          analysis_results: {
            lora: {
              timestamp: 20251024135227,
              event_file_path: `/root/data-local/dataset/log/model_training/lora/${modelTrainingId}/20251024135227/network_train/events.out.tfevents.1761285174.ins-qc6vt-dbfcd4799-lqrqt.13568.0`,
              analysis_result: {
                'loss/average': [
                  { step: 1, value: 0.42479532957077026, time: 1761285177.5636961 },
                  { step: 2, value: 0.44574201107025146, time: 1761285179.1815326 },
                  { step: 3, value: 0.4799327254295349, time: 1761285180.822029 },
                  { step: 4, value: 0.4123456789012345, time: 1761285182.123456 },
                  { step: 5, value: 0.3987654321098765, time: 1761285183.234567 },
                ],
                'lr/unet': [
                  { step: 1, value: 0.10000000149011612, time: 1761285177.5637407 },
                  { step: 2, value: 0.20000000298023224, time: 1761285179.1815758 },
                  { step: 3, value: 0.30000001192092896, time: 1761285180.822072 },
                  { step: 4, value: 0.4000000059604645, time: 1761285182.123456 },
                  { step: 5, value: 0.5000000074505806, time: 1761285183.234567 },
                ],
              },
            },
          },
        });
        return;
      }

      // 如果错误消息包含"未找到"和"对应的lora或unet文件夹"，不显示弹窗
      // 这是正常情况（模型训练尚未生成TensorBoard数据），不应该显示错误提示
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      if (errorMessage.includes('未找到') && errorMessage.includes('对应的lora或unet文件夹')) {
        // 静默处理，不显示错误弹窗
        setTensorboardAnalysis(null);
        return;
      }

      toast.error(`获取TensorBoard分析失败: ${errorMessage}`);
    } finally {
      setIsLoadingTensorboard(false);
    }
  };

  // 获取训练日志分析
  const fetchTrainingLogAnalysis = async () => {
    setIsLoadingLogAnalysis(true);
    try {
      const response = await fetch('/api/model-training/analyze-training-log', {
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
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setTrainingLogAnalysis(result.data);

        // 如果分析结果有进度数据，更新训练进度
        if (result.data.analysis_result?.progress_data?.percent) {
          const progressPercent = parseInt(result.data.analysis_result.progress_data.percent);
          if (!isNaN(progressPercent)) {
            setTrainingProgress(progressPercent);
          }
        }
      } else {
        throw new Error(result.message || '获取训练日志分析失败');
      }
    } catch (error) {
      // console.error('获取训练日志分析失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟训练日志分析数据
        setTrainingLogAnalysis({
          model_training_id: modelTrainingId,
          log_file_path: `/root/data-local/c_test/logs/${modelTrainingId}.log`,
          analysis_result: {
            status: 'Running',
            message: '训练正在进行中 (基于最后一条日志)',
            progress_data: {
              percent: '20',
              current_step: '196',
              total_step: '1000',
              elapsed_time: '05:34',
              remaining_time: '22:51',
              avr_loss: '0.434',
              full_line:
                '[2025-10-24 13:58:28] - INFO - [main] - main] - [steps:  20%|██████████████████████████████████████▊                                                                                                                                                               | 196/1000 [05:34<22:51,  1.71s/it, avr_loss=0.434]',
            },
            error_found: false,
          },
        });
        setTrainingProgress(20);
        return;
      }

      toast.error(`获取训练日志分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingLogAnalysis(false);
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

        // 处理 test_set 字段
        let testSetMode: 'number' | 'custom' = 'number';
        let testSetNumber: number | undefined = 4;
        let testSetCustom: string[] = [];

        if (config.test_set !== undefined) {
          if (typeof config.test_set === 'number') {
            testSetMode = 'number';
            testSetNumber = config.test_set;
          } else if (Array.isArray(config.test_set)) {
            testSetMode = 'custom';
            testSetCustom = config.test_set;
          }
        }

        // 更新表单值（如果数据库没查到数据，使用默认值）
        // 后端返回的是数据库存储名称，需要映射到前端字段名
        // 只有当字段在 config 中不存在时才使用默认值
        form.reset({
          fileStorageId:
            config.file_storage_id !== undefined
              ? config.file_storage_id
              : config.fileStorageId !== undefined
                ? config.fileStorageId
                : modelTrainingId,
          learningRate:
            config.learning_rate !== undefined
              ? config.learning_rate
              : config.learningRate !== undefined
                ? config.learningRate
                : '2e-5',
          unetLearningRate:
            config.unet_learning_rate !== undefined
              ? config.unet_learning_rate
              : config.unetLearningRate !== undefined
                ? config.unetLearningRate
                : '2e-6',
          textEncoderLr:
            config.text_encoder_lr !== undefined
              ? config.text_encoder_lr
              : config.textEncoderLr !== undefined
                ? config.textEncoderLr
                : '2e-6',
          modelName:
            config.output_name !== undefined
              ? config.output_name
              : config.modelName !== undefined
                ? config.modelName
                : displayName || '',
          modelType:
            config.model_training_type !== undefined
              ? config.model_training_type
              : config.modelTrainingType !== undefined
                ? config.modelTrainingType
                : undefined,
          repeat: config.repeat !== undefined ? config.repeat : 100,
          maxTrainEpochs:
            config.max_train_epoches !== undefined
              ? config.max_train_epoches
              : config.max_train_epochs !== undefined
                ? config.max_train_epochs
                : config.maxTrainEpochs !== undefined
                  ? config.maxTrainEpochs
                  : 6,
          trainBatchSize:
            config.batch_size !== undefined
              ? config.batch_size
              : config.trainBatchSize !== undefined
                ? config.trainBatchSize
                : 1,
          saveEveryNEpochs:
            config.save_every_n_epochs !== undefined
              ? config.save_every_n_epochs
              : config.saveEveryNEpochs !== undefined
                ? config.saveEveryNEpochs
                : 2,
          networkDim:
            config.network_dim !== undefined
              ? config.network_dim
              : config.networkDim !== undefined
                ? config.networkDim
                : 128,
          networkAlpha:
            config.network_alpha !== undefined
              ? config.network_alpha
              : config.networkAlpha !== undefined
                ? config.networkAlpha
                : 2,
          pretrainedModel:
            config.pretrained_model !== undefined
              ? config.pretrained_model
              : config.pretrainedModel !== undefined
                ? config.pretrainedModel
                : '',
          testSetMode,
          testSetNumber,
          testSetCustom,
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
          learningRate: '2e-5',
          unetLearningRate: '2e-6',
          textEncoderLr: '2e-6',
          modelName: displayName || '',
          modelType: undefined,
          repeat: 100,
          maxTrainEpochs: 6,
          trainBatchSize: 1,
          saveEveryNEpochs: 2,
          networkDim: 128,
          networkAlpha: 2,
          pretrainedModel: pretrainedModels.length > 0 ? pretrainedModels[0] : '',
          testSetMode: 'number',
          testSetNumber: 4,
          testSetCustom: [],
        });

        toast.success('使用默认训练配置（开发模式）');
        return;
      }

      toast.error(`获取训练配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // 组件挂载时获取配置和训练状态
  React.useEffect(() => {
    fetchTrainingConfig();
    refreshTrainingStatus();
  }, [modelTrainingId]);

  // 当底模列表加载完成且当前值为空时，设置默认值为列表中的第一个
  React.useEffect(() => {
    if (pretrainedModels.length > 0) {
      const currentValue = form.getValues('pretrainedModel');
      // 如果当前值为空，或者当前值不在列表中，则设置为列表中的第一个
      if (!currentValue || !pretrainedModels.includes(currentValue)) {
        form.setValue('pretrainedModel', pretrainedModels[0]);
      }
    }
  }, [pretrainedModels]);

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
        // console.log('训练状态数据:', trainingData);

        // 保存原始状态
        setRawTrainingStatus(trainingData.status || 'not_found');

        // 根据外部API返回的状态更新本地状态
        switch (trainingData.status) {
          case '1':
          case '2':
            setTrainingStatus('RUNNING');
            // 如果状态是训练中，同时获取日志分析和TensorBoard分析
            fetchTrainingLogAnalysis();
            fetchTensorboardAnalysis();
            break;
          case '-1':
            setTrainingStatus('COMPLETED');
            // 如果状态是已完成，获取TensorBoard分析
            fetchTensorboardAnalysis();
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

        // 同步调用刷新状态、日志分析和TensorBoard分析
        setTimeout(() => {
          refreshTrainingStatus();
          fetchTrainingLogAnalysis();
          fetchTensorboardAnalysis();
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

  // 跳转到模型测试
  const navigateToTest = () => {
    if (onNavigateToTest) {
      onNavigateToTest();
    } else {
      toast.info('请从模型训练详情页面进入模型测试');
    }
  };

  // 生成图表配置
  const getChartOption = (type: 'loss' | 'lr') => {
    // console.log('生成图表配置:', type, tensorboardAnalysis);

    if (!tensorboardAnalysis?.analysis_results) {
      // console.log('TensorBoard数据不存在或格式不正确');
      return {};
    }

    // 动态获取训练类型（lora, unet等）
    const trainingType = tensorboardAnalysis.training_type;
    const analysisData = tensorboardAnalysis.analysis_results[trainingType];

    if (!analysisData?.analysis_result) {
      // console.log('分析结果数据不存在，训练类型:', trainingType);
      return {};
    }

    const data = analysisData.analysis_result;

    // 选择loss数据：优先使用'loss/average'，如果没有则使用'loss'
    let chartData;
    if (type === 'loss') {
      chartData = data['loss/average'] || data['loss'];
      // console.log('Loss数据选择:', {
      //   'loss/average': data['loss/average']?.length || 0,
      //   'loss': data['loss']?.length || 0,
      //   '选择的数据': chartData?.length || 0
      // });
    } else {
      chartData = data['lr/unet'];
    }

    // console.log('图表数据:', type, chartData);
    // console.log('图表数据长度:', chartData?.length);
    // console.log('图表数据详情:', chartData?.map(item => ({ step: item.step, value: item.value })));

    if (!chartData || chartData.length === 0) {
      // console.log('图表数据为空');
      return {};
    }

    return {
      title: {
        text: type === 'loss' ? '训练损失' : '学习率',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: '600',
          color: '#374151',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
        },
        formatter: (params: any) => {
          const data = params[0];
          const value = data.data[1];
          const formattedValue =
            type === 'loss'
              ? value.toFixed(4)
              : value < 0.001
                ? `${(value * 1000000).toFixed(1)}e-6`
                : value.toFixed(6);
          return `步骤: ${data.data[0]}<br/>${type === 'loss' ? '损失值' : '学习率'}: ${formattedValue}`;
        },
      },
      xAxis: {
        type: 'category',
        name: '训练步骤',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        data: chartData.map((item) => item.step),
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisTick: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: type === 'loss' ? '损失值' : '学习率',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        scale: type === 'loss',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisTick: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: number) => {
            if (type === 'lr' && value < 0.001) {
              return `${(value * 1000000).toFixed(1)}e-6`;
            }
            return value.toFixed(4);
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: type === 'loss' ? '损失' : '学习率',
          type: 'line',
          data: chartData.map((item) => [item.step, item.value]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: type === 'loss' ? '#ef4444' : '#06b6d4',
            width: 2.5,
          },
          itemStyle: {
            color: type === 'loss' ? '#ef4444' : '#06b6d4',
            borderColor: '#ffffff',
            borderWidth: 1,
          },
          areaStyle:
            type === 'loss'
              ? {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
                      { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
                    ],
                  },
                }
              : {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(6, 182, 212, 0.2)' },
                      { offset: 1, color: 'rgba(6, 182, 212, 0.05)' },
                    ],
                  },
                },
        },
      ],
      grid: {
        left: '12%',
        right: '8%',
        bottom: '25%',
        top: '20%',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(59, 130, 246, 0.1)',
          handleStyle: {
            color: '#3b82f6',
            borderColor: '#3b82f6',
          },
          textStyle: {
            color: '#6b7280',
            fontSize: 10,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
        },
      ],
      backgroundColor: 'transparent',
    };
  };

  // 生成放大图表配置（增强版滑动放大功能）
  const getZoomChartOption = (type: 'loss' | 'lr') => {
    const baseOption = getChartOption(type);

    // 为放大图表添加更强大的dataZoom功能
    return {
      ...baseOption,
      grid: {
        left: '8%',
        right: '8%',
        bottom: '30%',
        top: '15%',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          height: 30,
          bottom: 15,
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: {
            color: '#3b82f6',
            borderColor: '#3b82f6',
            borderWidth: 2,
          },
          textStyle: {
            color: '#6b7280',
            fontSize: 11,
          },
          showDetail: true,
          showDataShadow: true,
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
        },
        {
          type: 'slider',
          show: true,
          yAxisIndex: [0],
          right: 10,
          width: 20,
          start: 0,
          end: 100,
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(59, 130, 246, 0.1)',
          handleStyle: {
            color: '#3b82f6',
            borderColor: '#3b82f6',
          },
          textStyle: {
            color: '#6b7280',
            fontSize: 10,
          },
        },
        {
          type: 'inside',
          yAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
        },
      ],
      toolbox: {
        show: true,
        right: 20,
        top: 20,
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: {
              zoom: '区域缩放',
              back: '区域缩放还原',
            },
          },
          restore: {
            title: '还原',
          },
          saveAsImage: {
            title: '保存为图片',
          },
        },
        iconStyle: {
          borderColor: '#6b7280',
        },
        emphasis: {
          iconStyle: {
            borderColor: '#3b82f6',
          },
        },
      },
    };
  };

  // 打开图表放大对话框
  const openChartDialog = (type: 'loss' | 'lr') => {
    setCurrentChartType(type);
    setShowChartDialog(true);
  };

  // 处理表单验证错误
  const onError = (errors: any) => {
    // 收集所有验证错误
    const errorMessages: string[] = [];

    if (errors.learningRate) {
      const message = errors.learningRate.message || '格式不正确，需要数字e-数字格式（如：2e-5）';
      errorMessages.push(`学习率: ${message}`);
    }
    if (errors.unetLearningRate) {
      const message = errors.unetLearningRate.message || '格式不正确，需要数字e-数字格式（如：2e-6）';
      errorMessages.push(`网络学习率: ${message}`);
    }
    if (errors.textEncoderLr) {
      const message = errors.textEncoderLr.message || '格式不正确，需要数字e-数字格式（如：2e-6）';
      errorMessages.push(`文本学习率: ${message}`);
    }
    if (errors.modelName) {
      errorMessages.push(`模型名称: ${errors.modelName.message || '请输入模型名称'}`);
    }
    if (errors.modelType) {
      errorMessages.push(`模型训练类型: ${errors.modelType.message || '请选择模型类型'}`);
    }
    if (errors.repeat) {
      errorMessages.push(`样本重复次数: ${errors.repeat.message || '必须大于0'}`);
    }
    if (errors.maxTrainEpochs) {
      errorMessages.push(`最大训练轮数: ${errors.maxTrainEpochs.message || '必须大于0'}`);
    }
    if (errors.trainBatchSize) {
      errorMessages.push(`训练批次大小: ${errors.trainBatchSize.message || '必须大于0'}`);
    }
    if (errors.saveEveryNEpochs) {
      errorMessages.push(`每N轮保存一次: ${errors.saveEveryNEpochs.message || '必须大于0'}`);
    }
    if (errors.networkDim) {
      errorMessages.push(`网络维度: ${errors.networkDim.message || '必须大于0'}`);
    }
    if (errors.networkAlpha) {
      errorMessages.push(`网络缩放因子: ${errors.networkAlpha.message || '必须大于0'}`);
    }
    if (errors.pretrainedModel) {
      errorMessages.push(`底模选择: ${errors.pretrainedModel.message || '请选择底模'}`);
    }
    if (errors.fileStorageId) {
      errorMessages.push(`文件存储ID: ${errors.fileStorageId.message || '请输入文件存储ID'}`);
    }
    if (errors.testSetNumber) {
      errorMessages.push(`测试集条数: ${errors.testSetNumber.message || '必须在1-10之间'}`);
    }
    if (errors.testSetCustom) {
      errorMessages.push(`自定义测试集: ${errors.testSetCustom.message || '请至少输入一条有效内容'}`);
    }

    // 显示toast提示（右下角弹出）
    if (errorMessages.length > 0) {
      const toastMessage =
        errorMessages.length === 1
          ? errorMessages[0]
          : `请检查并填写以下必填项：${errorMessages.slice(0, 3).join('、')}${errorMessages.length > 3 ? '等' : ''}`;
      toast.error(toastMessage);
    } else {
      toast.error('表单验证失败，请检查填写的信息');
    }
  };

  // 提交训练配置
  const onSubmit = async (data: TrainingConfigForm) => {
    try {
      // 处理测试集数据
      let testSet: number | string[] | undefined;
      if (data.testSetMode === 'number') {
        // 前N条模式：检查数字是否有效
        if (data.testSetNumber === undefined || data.testSetNumber === null || isNaN(data.testSetNumber)) {
          toast.error('请输入测试集条数（1-10）');
          return;
        }
        if (data.testSetNumber < 1 || data.testSetNumber > 10) {
          toast.error('测试集条数必须在1-10之间');
          return;
        }
        testSet = data.testSetNumber;
      } else if (data.testSetMode === 'custom') {
        // 自定义模式：检查是否有输入内容
        if (!data.testSetCustom || data.testSetCustom.length === 0) {
          toast.error('请至少输入一条自定义测试集内容');
          return;
        }
        // 过滤空字符串并去除换行符
        const filteredItems = data.testSetCustom
          .filter((item) => item.trim() !== '')
          .map((item) => item.replace(/\n/g, ''));
        // 检查过滤后是否还有内容
        if (filteredItems.length === 0) {
          toast.error('自定义测试集内容不能全部为空，请至少输入一条有效内容');
          return;
        }
        testSet = filteredItems;
      }

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
          unet_learning_rate: data.unetLearningRate,
          text_encoder_lr: data.textEncoderLr,
          output_name: data.modelName,
          model_training_type: data.modelType,
          repeat: data.repeat,
          max_train_epoches: data.maxTrainEpochs,
          batch_size: data.trainBatchSize,
          save_every_n_epochs: data.saveEveryNEpochs,
          network_dim: data.networkDim,
          network_alpha: data.networkAlpha,
          pretrained_model: data.pretrainedModel,
          file_storage_id: data.fileStorageId,
          test_set: testSet,
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
          // 显示具体的错误信息（包括未填写的字段列表）
          toast.error(message);
        }
      } else {
        // 如果返回的不是200，也显示错误信息
        const errorMessage = result.message || result.data?.message || '保存训练配置失败';
        toast.error(errorMessage);
        throw new Error(errorMessage);
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* 标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold">模型训练</h2>
          <p className="mt-2 text-muted-foreground">配置训练参数并开始模型训练</p>
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

            {/* 训练进度显示 - 仅在训练中状态时显示 */}
            {trainingStatus === 'RUNNING' && trainingLogAnalysis?.analysis_result?.progress_data && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">训练进度</span>
                    <span className="font-medium">{trainingLogAnalysis.analysis_result.progress_data.percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${trainingLogAnalysis.analysis_result.progress_data.percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">训练步骤：</span>
                    <span className="font-medium">
                      {trainingLogAnalysis.analysis_result.progress_data.current_step} /{' '}
                      {trainingLogAnalysis.analysis_result.progress_data.total_step}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">已用时间：</span>
                    <span className="font-medium">
                      {trainingLogAnalysis.analysis_result.progress_data.elapsed_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">剩余时间：</span>
                    <span className="font-medium">
                      {trainingLogAnalysis.analysis_result.progress_data.remaining_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">平均损失：</span>
                    <span className="font-medium">{trainingLogAnalysis.analysis_result.progress_data.avr_loss}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TensorBoard图表 - 仅在训练中和已完成状态时显示 */}
            {(trainingStatus === 'RUNNING' || trainingStatus === 'COMPLETED') &&
              tensorboardAnalysis?.analysis_results && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Loss图表 */}
                    {(() => {
                      const trainingType = tensorboardAnalysis?.training_type;
                      const analysisData = tensorboardAnalysis?.analysis_results?.[trainingType];
                      const lossAverageData = analysisData?.analysis_result?.['loss/average'];
                      const lossData = analysisData?.analysis_result?.['loss'];
                      const selectedLossData = lossAverageData || lossData;
                      return selectedLossData && selectedLossData.length > 0;
                    })() && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">训练损失</h4>
                          <Button variant="outline" size="small" onClick={() => openChartDialog('loss')}>
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="h-56 w-full rounded-lg border border-gray-200 bg-white p-2">
                          <ReactECharts option={getChartOption('loss')} style={{ height: '100%', width: '100%' }} />
                        </div>
                      </div>
                    )}

                    {/* Learning Rate图表 */}
                    {(() => {
                      const trainingType = tensorboardAnalysis?.training_type;
                      const analysisData = tensorboardAnalysis?.analysis_results?.[trainingType];
                      const lrData = analysisData?.analysis_result?.['lr/unet'];
                      return lrData && lrData.length > 0;
                    })() && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">学习率</h4>
                          <Button variant="outline" size="small" onClick={() => openChartDialog('lr')}>
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="h-56 w-full rounded-lg border border-gray-200 bg-white p-2">
                          <ReactECharts option={getChartOption('lr')} style={{ height: '100%', width: '100%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                <Button onClick={navigateToTest}>
                  <TestTube className="mr-2 h-4 w-4" />
                  模型测试
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

        {/* 训练配置 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
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
                    name="learningRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          学习率 <span className="text-xs text-muted-foreground">(learning_rate)</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="2e-5" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">格式：数字e-数字，如 2e-5, 2.5e-6 等</p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          模型名称 <span className="text-xs text-muted-foreground">(output_name)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="模型名称" {...field} />
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
                        <FormLabel>
                          训练模型类型 <span className="text-xs text-muted-foreground">(model_training_type)</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="请选择模型类型" />
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

                  <FormField
                    control={form.control}
                    name="repeat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          样本重复次数 <span className="text-xs text-muted-foreground">(repeat)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            disabled={rawTrainingStatus !== 'not_found'}
                          />
                        </FormControl>
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
                                <FormLabel>
                                  max_train_epoches{' '}
                                  <span className="text-xs text-muted-foreground">(一共训练多少轮)</span>
                                </FormLabel>
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
                                <FormLabel>
                                  batch_size <span className="text-xs text-muted-foreground">(训练批次大小)</span>
                                </FormLabel>
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
                                <FormLabel>
                                  save_every_n_epochs{' '}
                                  <span className="text-xs text-muted-foreground">(多少轮保存一次)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="networkDim"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  network_dim <span className="text-xs text-muted-foreground">(网络维度)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="128" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="networkAlpha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  network_alpha <span className="text-xs text-muted-foreground">(网络缩放因子)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="pretrainedModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  pretrained_model <span className="text-xs text-muted-foreground">(底模选择)</span>
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isLoadingPretrainedModels}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder={isLoadingPretrainedModels ? '加载中...' : '选择底模'} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {pretrainedModels.length > 0 ? (
                                      pretrainedModels.map((model) => (
                                        <SelectItem key={model} value={model}>
                                          {model}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {isLoadingPretrainedModels ? '加载中...' : '暂无可用底模'}
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="unetLearningRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  unet_learning_rate <span className="text-xs text-muted-foreground">(网络学习率)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="text" placeholder="2e-6" {...field} />
                                </FormControl>
                                <FormMessage />
                                <p className="text-sm text-muted-foreground">格式：数字e-数字，如 2e-6, 2.5e-6 等</p>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="textEncoderLr"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  text_encoder_lr <span className="text-xs text-muted-foreground">(文本学习率)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input type="text" placeholder="2e-6" {...field} />
                                </FormControl>
                                <FormMessage />
                                <p className="text-sm text-muted-foreground">格式：数字e-数字，如 2e-6, 2.5e-6 等</p>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="fileStorageId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  file_storage_id <span className="text-xs text-muted-foreground">(文件存储ID)</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="文件存储ID"
                                    {...field}
                                    disabled
                                    className="cursor-not-allowed bg-muted/50"
                                  />
                                </FormControl>
                                <FormMessage />
                                <p className="text-sm text-muted-foreground">
                                  文件存储ID自动设置为当前模型训练ID，不可修改
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 测试集输入 */}
                        <div className="col-span-full space-y-4 border-t pt-4">
                          <FormField
                            control={form.control}
                            name="testSetMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="m-0 text-base">
                                    test_set <span className="text-xs text-muted-foreground">(测试集输入)</span>
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {field.value === 'custom' ? '自定义输入（最多10条）' : '测试集前N条（1-10）'}
                                  </p>
                                </div>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">前N条</span>
                                    <Switch
                                      checked={field.value === 'custom'}
                                      onCheckedChange={(checked) => {
                                        field.onChange(checked ? 'custom' : 'number');
                                      }}
                                    />
                                    <span className="text-sm text-muted-foreground">自定义</span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch('testSetMode') === 'number' ? (
                            <FormField
                              control={form.control}
                              name="testSetNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">测试集条数</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={10}
                                      placeholder="4"
                                      value={field.value?.toString() ?? ''}
                                      onChange={(inputValue) => {
                                        const value = inputValue ? parseInt(inputValue, 10) : undefined;
                                        if (value !== undefined && value >= 1 && value <= 10) {
                                          field.onChange(value);
                                        } else if (inputValue === '') {
                                          field.onChange(undefined);
                                        }
                                      }}
                                      className="w-full"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-sm text-muted-foreground">输入1-10之间的数字，默认4条</p>
                                </FormItem>
                              )}
                            />
                          ) : (
                            <FormField
                              control={form.control}
                              name="testSetCustom"
                              render={({ field }) => {
                                // 确保 customItems 始终是数组
                                const customItems = Array.isArray(field.value) ? field.value : [];
                                const maxItems = 10;

                                const addItem = () => {
                                  if (customItems.length < maxItems) {
                                    field.onChange([...customItems, '']);
                                  }
                                };

                                const removeItem = (index: number) => {
                                  const newItems = customItems.filter((_, i) => i !== index);
                                  field.onChange(newItems);
                                };

                                const updateItem = (index: number, value: string) => {
                                  // 移除换行符
                                  const cleanedValue = value.replace(/\n/g, '');
                                  const newItems = [...customItems];
                                  newItems[index] = cleanedValue;
                                  field.onChange(newItems);
                                };

                                return (
                                  <FormItem>
                                    <FormLabel className="text-sm">自定义测试集输入</FormLabel>
                                    <div className="grid grid-cols-2 gap-3">
                                      {customItems.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                          <FormControl>
                                            <Textarea
                                              placeholder={`输入第 ${index + 1} 条测试集内容`}
                                              value={item}
                                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                updateItem(index, e.target.value)
                                              }
                                              className="min-h-[75px] w-full"
                                              maxLength={500}
                                            />
                                          </FormControl>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="small"
                                            onClick={() => removeItem(index)}
                                            className="w-full"
                                          >
                                            删除
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    {customItems.length < maxItems && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="small"
                                        onClick={addItem}
                                        className="mt-3 w-full"
                                      >
                                        添加一条 ({customItems.length}/{maxItems})
                                      </Button>
                                    )}
                                    <FormMessage />
                                    <p className="text-sm text-muted-foreground">
                                      最多可添加10条，每条内容不能包含换行符（会自动删除）
                                    </p>
                                  </FormItem>
                                );
                              }}
                            />
                          )}
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

      {/* 图表放大对话框 */}
      <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentChartType === 'loss' ? '训练损失图表' : '学习率图表'}</DialogTitle>
            <DialogDescription>
              支持多种缩放方式：鼠标滚轮缩放、拖拽滑动条、工具箱按钮。可以精确查看特定区域的数据。
            </DialogDescription>
          </DialogHeader>
          <div className="h-96 w-full rounded-lg border border-gray-200 bg-white p-4">
            <ReactECharts option={getZoomChartOption(currentChartType)} style={{ height: '100%', width: '100%' }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
