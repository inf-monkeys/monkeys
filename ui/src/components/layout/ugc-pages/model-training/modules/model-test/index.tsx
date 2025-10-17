import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Download, Link, Settings, TestTube, X } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// 模型类型枚举
const MODEL_TYPES = [
  { value: 'flux', label: 'Flux', description: 'Flux 模型' },
  { value: 'lora', label: 'LoRA', description: 'LoRA 模型' },
  { value: 'qwen', label: 'Qwen', description: 'Qwen 模型' },
] as const;

// 表单验证schema
const modelTestSchema = z.object({
  feishuUrl: z.string().url('请输入有效的飞书表格URL'),
  modelType: z.enum(['flux', 'lora', 'qwen']).refine((val) => val !== undefined, {
    message: '请选择模型类型',
  }),
  modelPathPrefix: z.string().optional(),
  customColumns: z.array(z.string()).optional(),
  useImageDimensions: z.boolean(),
});

type ModelTestForm = z.infer<typeof modelTestSchema>;

interface IModelTestModuleProps {
  modelTrainingId: string;
}

interface ITableHeader {
  columnName: string;
  columnType: string;
  sampleData?: string;
}

export const ModelTestModule: React.FC<IModelTestModuleProps> = ({ modelTrainingId }) => {
  const [tableHeaders, setTableHeaders] = useState<ITableHeader[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const form = useForm<ModelTestForm>({
    resolver: zodResolver(modelTestSchema),
    defaultValues: {
      feishuUrl: '',
      modelType: undefined,
      modelPathPrefix: '',
      useImageDimensions: true,
    },
  });

  // 验证URL是否为飞书表格URL
  const isValidFeishuUrl = (url: string): boolean => {
    const feishuPattern = /^https:\/\/caka-labs\.feishu\.cn\//i;
    return feishuPattern.test(url);
  };

  // 获取模型测试配置
  const fetchModelTestConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch('/api/model-training/get-model-test-config', {
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

      // console.log('获取模型测试配置API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        const configData = result.data;

        // 更新表单字段，只填入非空值
        const updateData: Partial<ModelTestForm> = {};

        if (configData.feishuTestTableUrl) {
          updateData.feishuUrl = configData.feishuTestTableUrl;
        }

        if (configData.modelTrainingType) {
          updateData.modelType = configData.modelTrainingType as 'flux' | 'lora' | 'qwen';
        }

        // 使用reset方法更新表单，保留现有值
        form.reset({
          ...form.getValues(),
          ...updateData,
        });

        // console.log('模型测试配置已更新:', updateData);
      } else {
        throw new Error(result.message || '获取模型测试配置失败');
      }
    } catch (error) {
      // console.error('获取模型测试配置失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟配置数据
        const mockConfig = {
          feishuUrl:
            'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tblO6VoXRtwncnHx&view=vewGBz8reI',
          modelType: 'flux' as const,
        };

        form.reset({
          ...form.getValues(),
          ...mockConfig,
        });

        // console.log('使用模拟配置数据:', mockConfig);
        return;
      }

      toast.error(`获取模型测试配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // 组件加载时获取配置
  useEffect(() => {
    if (modelTrainingId) {
      fetchModelTestConfig();
    }
  }, [modelTrainingId]);

  // 获取表格表头数据
  const fetchTableHeaders = async () => {
    const feishuUrl = form.getValues('feishuUrl');

    if (!feishuUrl) {
      toast.error('请先输入飞书表格URL');
      return;
    }

    if (!isValidFeishuUrl(feishuUrl)) {
      toast.error('请输入有效的飞书表格URL（必须以 https://caka-labs.feishu.cn 开头）');
      return;
    }

    setIsLoadingHeaders(true);
    try {
      // 调用真实的后端API获取表头
      const response = await fetch('/api/model-training/feishu-table-headers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          url: feishuUrl,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('获取表头API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 解析表头数据，转换为ITableHeader格式
        const headersData = result.data;

        // 确保headersData是数组格式
        let headersArray: string[] = [];
        if (Array.isArray(headersData)) {
          headersArray = headersData;
        } else if (typeof headersData === 'string') {
          // 如果是字符串，尝试解析为数组
          try {
            const parsed = JSON.parse(headersData);
            headersArray = Array.isArray(parsed) ? parsed : [headersData];
          } catch {
            headersArray = [headersData];
          }
        } else if (typeof headersData === 'object' && headersData !== null) {
          // 如果是对象，尝试提取数组
          if (Array.isArray(headersData.headers)) {
            headersArray = headersData.headers;
          } else if (Array.isArray(headersData.data)) {
            headersArray = headersData.data;
          } else {
            // 将对象的键作为表头
            headersArray = Object.keys(headersData);
          }
        } else {
          // console.warn('无法解析表头数据:', headersData);
          headersArray = [];
        }

        // 需要过滤掉的字段
        const excludedFields = ['编号', '长宽', '图片', '图片来源', '提示词文本', '是否通过'];

        // 过滤掉指定的字段
        const filteredHeadersArray = headersArray.filter((header) => !excludedFields.includes(header));

        const parsedHeaders: ITableHeader[] = filteredHeadersArray.map((header: string, index: number) => ({
          columnName: header,
          columnType: 'string', // 默认类型为string
          sampleData: `示例数据_${index + 1}`, // 生成示例数据
        }));

        setTableHeaders(parsedHeaders);
        toast.success(`成功获取表格表头信息，共 ${parsedHeaders.length} 列`);
      } else {
        throw new Error(result.message || '获取表格表头失败');
      }
    } catch (error) {
      // console.error('获取表格表头失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟返回的表头数据
        const mockHeaders: ITableHeader[] = [
          { columnName: '测试ID', columnType: 'string', sampleData: 'TEST_001' },
          { columnName: '图片路径', columnType: 'string', sampleData: '/path/to/image1.jpg' },
          { columnName: '预测结果', columnType: 'string', sampleData: 'cat' },
          { columnName: '真实标签', columnType: 'string', sampleData: 'cat' },
          { columnName: '置信度', columnType: 'number', sampleData: '0.95' },
          { columnName: '测试时间', columnType: 'datetime', sampleData: '2024-01-15 10:30:00' },
          { columnName: '模型版本', columnType: 'string', sampleData: 'v1.2.3' },
          { columnName: '准确率', columnType: 'number', sampleData: '0.98' },
        ];

        setTableHeaders(mockHeaders);
        toast.success('成功获取表格表头信息！（开发模式）');
        return;
      }

      toast.error(`获取表格表头失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTableHeaders([]);
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  // 从表头添加列
  const addColumnFromHeader = (columnName: string) => {
    if (!customColumns.includes(columnName)) {
      setCustomColumns([...customColumns, columnName]);
    }
  };

  // 删除自定义列
  const removeCustomColumn = (index: number) => {
    setCustomColumns(customColumns.filter((_, i) => i !== index));
  };

  // 提交模型测试
  const onSubmit = async (data: ModelTestForm) => {
    setIsTesting(true);
    setTestStatus('idle');

    try {
      // 调用真实的后端API开始模型测试
      const response = await fetch('/api/model-training/start-model-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: modelTrainingId,
          spreadsheet_url: data.feishuUrl,
          model_type: data.modelType,
          path: data.modelPathPrefix || '',
          custom_columns: customColumns,
          length_width: data.useImageDimensions,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('开始模型测试API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 检查返回的code值
        const responseCode = result.data.code;
        const responseMessage = result.data.message || '模型测试任务已提交';

        if (responseCode === 200) {
          setTestStatus('success');
          toast.success('模型测试任务提交成功！');
        } else {
          setTestStatus('error');
          toast.error(`测试失败: ${responseMessage}`);
        }
      } else {
        throw new Error(result.message || '模型测试任务提交失败');
      }
    } catch (error) {
      // console.error('模型测试任务提交失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟测试成功
        setTestStatus('success');
        toast.success('模型测试任务提交成功！（开发模式）');
        return;
      }

      setTestStatus('error');
      toast.error(`模型测试任务提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* 标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold">模型测试</h2>
          <p className="mt-2 text-muted-foreground">使用测试数据集评估模型效果和性能</p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={fetchModelTestConfig}
              loading={isLoadingConfig}
              className="h-8"
            >
              刷新配置
            </Button>
            <span className="text-xs text-muted-foreground">模型训练ID: {modelTrainingId}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 飞书表格URL输入 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  测试表格配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="feishuUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>飞书表格URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="https://caka-labs.feishu.cn/..." {...field} className="min-w-0 flex-1" />
                          <Button
                            type="button"
                            onClick={fetchTableHeaders}
                            loading={isLoadingHeaders}
                            disabled={!field.value}
                            variant="outline"
                            className="h-10 flex-shrink-0"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            获取表头
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        请输入 caka-labs 飞书表格的完整URL，系统将自动解析表格结构
                      </p>
                    </FormItem>
                  )}
                />

                {/* 表头信息展示 */}
                {tableHeaders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">可测试模型列：</h4>
                    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2 pr-2 md:grid-cols-3 lg:grid-cols-4">
                        {tableHeaders.map((header, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer justify-start hover:bg-primary/10"
                            onClick={() => addColumnFromHeader(header.columnName)}
                          >
                            <span className="truncate">{header.columnName}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 模型选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  模型选择
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="modelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>选择模型类型</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="模型类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MODEL_TYPES.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">选择要用于测试的模型类型</p>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 高级设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  高级设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  高级选项
                </Button>

                {showAdvanced && (
                  <Card className="bg-muted/50">
                    <CardContent className="space-y-4 pt-4">
                      {/* 模型路径前缀 */}
                      <FormField
                        control={form.control}
                        name="modelPathPrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>模型路径前缀</FormLabel>
                            <FormControl>
                              <Input placeholder="output" {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-muted-foreground">指定模型文件的路径前缀</p>
                          </FormItem>
                        )}
                      />

                      {/* 自定义列管理 */}
                      <div>
                        <FormLabel className="text-sm font-medium">自定义列名称</FormLabel>
                        <div className="mt-2 space-y-4">
                          {/* 从表头添加列 */}
                          {tableHeaders.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">
                                点击表头列名添加到自定义列
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {tableHeaders.map((header, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => addColumnFromHeader(header.columnName)}
                                  >
                                    {header.columnName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 已添加的自定义列 */}
                          {customColumns.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">已添加的自定义列</label>
                              <div className="flex flex-wrap gap-2">
                                {customColumns.map((column, index) => (
                                  <Badge key={index} variant="default" className="flex items-center gap-1">
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
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 是否使用图片长宽 */}
                      <FormField
                        control={form.control}
                        name="useImageDimensions"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>是否使用图片的长宽</FormLabel>
                              <p className="text-sm text-muted-foreground">在测试中使用图片的尺寸信息（默认开启）</p>
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
              </CardContent>
            </Card>

            {/* 提交按钮和状态 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    size="large"
                    className="w-full"
                    loading={isTesting}
                    disabled={!form.getValues('feishuUrl') || !form.getValues('modelType')}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    开始模型测试
                  </Button>

                  {/* 状态提示 */}
                  {testStatus === 'success' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        模型测试任务已成功提交！系统将开始测试您的模型，请稍后查看测试结果。
                      </AlertDescription>
                    </Alert>
                  )}

                  {testStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>模型测试任务提交失败，请检查配置后重试。</AlertDescription>
                    </Alert>
                  )}
                </div>
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
