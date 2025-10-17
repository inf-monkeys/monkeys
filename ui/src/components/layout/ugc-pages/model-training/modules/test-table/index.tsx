import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Plus, RefreshCw, Settings, Table, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { vinesHeader } from '@/apis/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// 创建测试表表单验证schema
const createTestTableSchema = z.object({
  modelName: z.string().min(1, '请输入模型名称'),
  trainingRounds: z.string().min(1, '训练轮数必须大于0'),
  saveInterval: z.string().min(1, '保存间隔必须大于0'),
  customColumns: z.array(z.string()).optional(),
  createImageDimensions: z.boolean(),
});

// 上传数据表单验证schema
const uploadDataSchema = z.object({
  imageCount: z.string().min(1, '图片数量必须大于0'),
  dataTaskId: z.string().min(1, '请输入数据拉取任务ID'),
  dataFilePath: z.string().optional(),
  uploadImageDimensions: z.boolean(),
});

type CreateTestTableForm = z.infer<typeof createTestTableSchema>;
type UploadDataForm = z.infer<typeof uploadDataSchema>;

interface ITestTableModuleProps {
  modelTrainingId: string;
}

export const TestTableModule: React.FC<ITestTableModuleProps> = ({ modelTrainingId }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'upload'>('create');
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
  const [showAdvancedUpload, setShowAdvancedUpload] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [createdTableUrl, setCreatedTableUrl] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // 创建测试表表单
  const createForm = useForm<CreateTestTableForm>({
    resolver: zodResolver(createTestTableSchema),
    defaultValues: {
      modelName: '',
      trainingRounds: '100',
      saveInterval: '10',
      createImageDimensions: true,
    },
  });

  // 上传数据表单
  const uploadForm = useForm<UploadDataForm>({
    resolver: zodResolver(uploadDataSchema),
    defaultValues: {
      imageCount: '100',
      dataTaskId: modelTrainingId, // 默认使用当前模型训练ID
      dataFilePath: '',
      uploadImageDimensions: true,
    },
  });

  // 获取测试表配置
  const fetchTestTableConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch('/api/model-training/get-test-table-config', {
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

      // console.log('获取测试表配置API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        const config = result.data;

        // 更新创建测试表表单值
        const updateData: Partial<CreateTestTableForm> = {};

        if (config.modelName) {
          updateData.modelName = config.modelName;
        }
        if (config.maxTrainEpochs) {
          updateData.trainingRounds = config.maxTrainEpochs.toString();
        }
        if (config.saveEveryNEpochs) {
          updateData.saveInterval = config.saveEveryNEpochs.toString();
        }

        // 只更新有值的字段
        if (Object.keys(updateData).length > 0) {
          createForm.reset({
            ...createForm.getValues(),
            ...updateData,
          });
        }

        toast.success('测试表配置加载成功');
      } else {
        throw new Error(result.message || '获取测试表配置失败');
      }
    } catch (error) {
      // console.error('获取测试表配置失败:', error);

      // 如果是连接错误，在开发模式下使用默认值
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用默认配置进行开发测试');
        toast.success('使用默认测试表配置（开发模式）');
        return;
      }

      toast.error(`获取测试表配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // 组件挂载时获取配置
  React.useEffect(() => {
    fetchTestTableConfig();
  }, [modelTrainingId]);

  // 添加自定义列
  const addCustomColumn = () => {
    if (newColumnName.trim() && !customColumns.includes(newColumnName.trim())) {
      setCustomColumns([...customColumns, newColumnName.trim()]);
      setNewColumnName('');
    }
  };

  // 删除自定义列
  const removeCustomColumn = (index: number) => {
    setCustomColumns(customColumns.filter((_, i) => i !== index));
  };

  // 创建测试表
  const onCreateTestTable = async (data: CreateTestTableForm) => {
    setIsCreating(true);
    try {
      // 调用真实的后端API创建测试表
      const response = await fetch('/api/model-training/create-test-table-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: modelTrainingId,
          model_name: data.modelName,
          max_train_epochs: Number(data.trainingRounds),
          save_every_n_epochs: Number(data.saveInterval),
          custom_column: customColumns,
          length_width: data.createImageDimensions,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('创建测试表API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data?.url) {
        const testTableUrl = result.data.url;
        setCreatedTableUrl(testTableUrl);
        toast.success('测试表创建成功！');
      } else {
        throw new Error(result.message || '创建测试表失败');
      }
    } catch (error) {
      // console.error('创建测试表失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟返回URL
        const mockUrl = `https://caka-labs.feishu.cn/sheets/test_${Date.now()}`;
        setCreatedTableUrl(mockUrl);
        toast.success('测试表创建成功！（开发模式）');
        return;
      }

      toast.error(`创建测试表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // 上传数据到测试表
  const onUploadData = async (data: UploadDataForm) => {
    setIsUploading(true);
    try {
      // 调用真实的后端API上传数据到测试表
      const response = await fetch('/api/model-training/upload-data-to-test-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: modelTrainingId,
          quantity: Number(data.imageCount),
          model_training_id: data.dataTaskId,
          save_path: data.dataFilePath || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('上传数据到测试表API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 检查返回的code值
        const responseCode = result.data.code;
        const responseMessage = result.data.message || '数据上传完成';

        if (responseCode === 200) {
          toast.success('数据上传成功！');
        } else {
          toast.error(`上传失败: ${responseMessage}`);
        }
      } else {
        throw new Error(result.message || '上传数据到测试表失败');
      }
    } catch (error) {
      // console.error('上传数据到测试表失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟上传成功
        toast.success('数据上传成功！（开发模式）');
        return;
      }

      toast.error(`上传数据到测试表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* 标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold">测试表创建</h2>
          <p className="mt-2 text-muted-foreground">创建测试数据集并上传数据，用于评估模型效果</p>
        </div>

        {/* 功能选择 */}
        <div className="flex gap-4">
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2"
          >
            <Table className="h-4 w-4" />
            创建测试表
          </Button>
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            上传数据到测试表
          </Button>
        </div>

        {/* 创建测试表 */}
        {activeTab === 'create' && (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateTestTable)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      创建测试表
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={fetchTestTableConfig}
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
                      control={createForm.control}
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
                      control={createForm.control}
                      name="trainingRounds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>模型训练轮数</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="saveInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>模型多少轮保存一次</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 高级选项 */}
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => setShowAdvancedCreate(!showAdvancedCreate)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      高级选项
                    </Button>

                    {showAdvancedCreate && (
                      <Card className="bg-muted/50">
                        <CardContent className="space-y-4 pt-4">
                          {/* 自定义列 */}
                          <div>
                            <label className="text-sm font-medium">自定义列</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="输入列名"
                                  value={newColumnName}
                                  onChange={(e) => setNewColumnName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addCustomColumn();
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addCustomColumn();
                                  }}
                                  size="small"
                                  disabled={!newColumnName.trim()}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {customColumns.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {customColumns.map((column, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                      {column}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeCustomColumn(index);
                                        }}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 是否创建图片长宽 */}
                          <FormField
                            control={createForm.control}
                            name="createImageDimensions"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>是否创建图片的长宽</FormLabel>
                                  <p className="text-sm text-muted-foreground">在测试表中包含图片的尺寸信息</p>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Separator />

                  {/* 提交按钮 */}
                  <Button type="submit" loading={isCreating} className="w-full">
                    <Table className="mr-2 h-4 w-4" />
                    创建测试表
                  </Button>

                  {/* 创建结果 */}
                  {createdTableUrl && (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        测试表创建成功！URL:{' '}
                        <a
                          href={createdTableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {createdTableUrl}
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        )}

        {/* 上传数据到测试表 */}
        {activeTab === 'upload' && (
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(onUploadData)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    上传数据到测试表
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={uploadForm.control}
                      name="imageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>上传多少张图片到测试表</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={uploadForm.control}
                      name="dataTaskId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>数据拉取任务的ID</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入任务ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 高级选项 */}
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => setShowAdvancedUpload(!showAdvancedUpload)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      高级选项
                    </Button>

                    {showAdvancedUpload && (
                      <Card className="bg-muted/50">
                        <CardContent className="space-y-4 pt-4">
                          <FormField
                            control={uploadForm.control}
                            name="dataFilePath"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>输入数据拉取文件的完整路径</FormLabel>
                                <FormControl>
                                  <Input placeholder="/root/data-local/mat_v3" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={uploadForm.control}
                            name="uploadImageDimensions"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>是否上传图片的长宽</FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    在测试表中包含图片的尺寸信息（默认开启）
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Separator />

                  {/* 提交按钮 */}
                  <Button type="submit" loading={isUploading} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    上传数据到测试表
                  </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}

        {/* 底部占位区域 */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};
