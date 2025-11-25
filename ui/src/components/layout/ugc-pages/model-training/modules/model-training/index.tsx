import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import ReactECharts from 'echarts-for-react';
import { Brain, Clock, Download, Maximize2, Play, RefreshCw, Settings, Square, Upload } from 'lucide-react';
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

      toast.error(`获取TensorBoard分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
        // console.log('训练状态数据:', trainingData);

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

  // 下载模型
  const downloadModel = () => {
    toast.success('开始下载模型文件...');
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
                  {/* 调试信息已注释
                <div className="text-sm text-gray-600 space-y-1">
                  <div>调试信息: 训练状态={trainingStatus}, TensorBoard数据存在={!!tensorboardAnalysis}, 训练类型={tensorboardAnalysis?.training_type}</div>
                  {(() => {
                    const trainingType = tensorboardAnalysis?.training_type;
                    const analysisData = tensorboardAnalysis?.analysis_results?.[trainingType];
                    const lossAverageData = analysisData?.analysis_result?.['loss/average'];
                    const lossData = analysisData?.analysis_result?.['loss'];
                    const lrData = analysisData?.analysis_result?.['lr/unet'];
                    const selectedLossData = lossAverageData || lossData;
                    return (
                      <div>
                        Loss数据: {lossAverageData ? `loss/average(${lossAverageData.length}条)` : ''} 
                        {lossData && !lossAverageData ? `loss(${lossData.length}条)` : ''}
                        {!lossAverageData && !lossData ? '无' : ''}, 
                        LR数据: {lrData ? `${lrData.length}条` : '无'}
                      </div>
                    );
                  })()}
                </div>
                */}
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
