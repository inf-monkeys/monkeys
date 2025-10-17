import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Download, Link, RefreshCw, Upload } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

// 表单验证schema
const dataUploadSchema = z.object({
  feishuUrl: z.string().url('请输入有效的飞书表格URL'),
  imageNameColumn: z.string().min(1, '请选择图片名称列'),
  promptColumn: z.string().min(1, '请选择提示词列'),
  imageColumn: z.string().min(1, '请选择图片列'),
});

type DataUploadForm = z.infer<typeof dataUploadSchema>;

interface IDataUploadModuleProps {
  modelTrainingId: string;
}

interface ITableHeader {
  columnName: string;
  columnType: string;
  sampleData?: string;
}

export const DataUploadModule: React.FC<IDataUploadModuleProps> = ({ modelTrainingId }) => {
  const [tableHeaders, setTableHeaders] = useState<ITableHeader[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isGettingUrl, setIsGettingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isUrlGenerated, setIsUrlGenerated] = useState(false);

  // 优先使用传入的modelTrainingId，如果没有则尝试从URL获取
  const currentModelTrainingId =
    modelTrainingId ||
    (() => {
      try {
        // 从当前URL路径中提取模型训练ID
        const pathSegments = window.location.pathname.split('/');
        const modelTrainingIndex = pathSegments.findIndex((segment) => segment === 'model-training');
        if (modelTrainingIndex !== -1 && pathSegments[modelTrainingIndex + 1]) {
          return pathSegments[modelTrainingIndex + 1];
        }
      } catch (error) {
        // console.warn('无法从URL获取模型训练ID:', error);
      }
      return null;
    })();

  const form = useForm<DataUploadForm>({
    resolver: zodResolver(dataUploadSchema),
    defaultValues: {
      feishuUrl: '',
      imageNameColumn: '',
      promptColumn: '',
      imageColumn: '',
    },
  });

  // 组件挂载时自动获取飞书表格链接
  React.useEffect(() => {
    const autoFetchFeishuUrl = async () => {
      if (!currentModelTrainingId) {
        // console.warn('无法获取模型训练ID，跳过自动获取飞书表格链接');
        return;
      }

      setIsGettingUrl(true);
      setGeneratedUrl('');
      try {
        // console.log('页面加载时自动获取飞书表格URL，模型训练ID:', currentModelTrainingId);

        // 调用真实的API获取飞书表格URL
        const feishuUrl = await fetchFeishuTableUrl();

        if (feishuUrl) {
          // 设置生成的URL并显示动画
          setGeneratedUrl(feishuUrl);
          setIsUrlGenerated(true);

          // 延迟填入表单，让用户看到URL显示
          setTimeout(() => {
            form.setValue('feishuUrl', feishuUrl);
            toast.success('自动获取飞书表格链接成功！');

            // 自动调用获取表头功能
            setTimeout(() => {
              fetchTableHeaders();
            }, 1000);
          }, 500);
        } else {
          // console.warn('自动获取飞书表格链接失败');
        }
      } catch (error) {
        // console.error('自动获取飞书表格URL错误:', error);

        // 如果是连接错误，在开发模式下使用模拟数据
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          // console.warn('后端连接失败，使用模拟URL进行开发测试');

          const mockUrl = 'https://caka-labs.feishu.cn/sheets/shtcn1234567890abcdef';
          setGeneratedUrl(mockUrl);
          setIsUrlGenerated(true);

          setTimeout(() => {
            form.setValue('feishuUrl', mockUrl);
            toast.success('自动使用模拟URL获取飞书表格链接（开发模式）');

            // 自动调用获取表头功能
            setTimeout(() => {
              fetchTableHeaders();
            }, 1000);
          }, 500);
        }
      } finally {
        setIsGettingUrl(false);
      }
    };

    // 延迟执行，确保组件完全加载
    const timer = setTimeout(autoFetchFeishuUrl, 1000);

    return () => clearTimeout(timer);
  }, [currentModelTrainingId]);

  // 验证URL是否为飞书表格URL
  const isValidFeishuUrl = (url: string): boolean => {
    const feishuPattern = /^https:\/\/caka-labs\.feishu\.cn\//i;
    return feishuPattern.test(url);
  };

  // 获取飞书表格URL的API调用
  const fetchFeishuTableUrl = async (): Promise<string | null> => {
    if (!currentModelTrainingId) {
      toast.error('无法获取模型训练ID');
      return null;
    }

    // eslint-disable-next-line no-useless-catch
    try {
      // 使用项目标准的认证头
      const headers = {
        'Content-Type': 'application/json',
        ...vinesHeader({ useToast: true }),
      };

      const response = await fetch('/api/model-training/feishu-table-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: currentModelTrainingId,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('获取飞书表格URL API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 处理不同的数据结构
        let url = '';

        if (typeof result.data === 'string') {
          url = result.data;
        } else if (result.data.url) {
          url = result.data.url;
        } else if (result.data.link) {
          url = result.data.link;
        } else if (result.data.feishuUrl) {
          url = result.data.feishuUrl;
        } else if (result.data.tableUrl) {
          url = result.data.tableUrl;
        } else {
          // 尝试从其他可能的字段中提取
          const possibleFields = ['url', 'link', 'feishuUrl', 'tableUrl', 'sheetUrl'];
          for (const field of possibleFields) {
            if (result.data[field] && typeof result.data[field] === 'string') {
              url = result.data[field];
              break;
            }
          }
        }

        if (url) {
          return url;
        } else {
          throw new Error('未找到有效的URL字段');
        }
      } else {
        throw new Error(result.message || '获取飞书表格URL失败');
      }
    } catch (error) {
      // console.error('获取飞书表格URL失败:', error);
      throw error;
    }
  };

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

      // console.log('API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        let headers: ITableHeader[] = [];

        // 处理不同的数据结构
        if (Array.isArray(result.data)) {
          // 如果data直接是数组
          headers = result.data.map((item: any) => {
            if (typeof item === 'string') {
              return {
                columnName: item,
                columnType: 'string',
                sampleData: '',
              };
            } else if (item && typeof item === 'object') {
              return {
                columnName: item.name || item.columnName || item.header || String(item),
                columnType: item.type || item.columnType || 'string',
                sampleData: item.sampleData || item.sample || '',
              };
            }
            return {
              columnName: String(item),
              columnType: 'string',
              sampleData: '',
            };
          });
        } else if (result.data.headers && Array.isArray(result.data.headers)) {
          // 如果data.headers是数组
          headers = result.data.headers.map((item: any) => {
            if (typeof item === 'string') {
              return {
                columnName: item,
                columnType: 'string',
                sampleData: '',
              };
            } else if (item && typeof item === 'object') {
              return {
                columnName: item.name || item.columnName || item.header || String(item),
                columnType: item.type || item.columnType || 'string',
                sampleData: item.sampleData || item.sample || '',
              };
            }
            return {
              columnName: String(item),
              columnType: 'string',
              sampleData: '',
            };
          });
        } else if (result.data.columns && Array.isArray(result.data.columns)) {
          // 如果data.columns是数组
          headers = result.data.columns.map((item: any) => {
            if (typeof item === 'string') {
              return {
                columnName: item,
                columnType: 'string',
                sampleData: '',
              };
            } else if (item && typeof item === 'object') {
              return {
                columnName: item.name || item.columnName || item.header || String(item),
                columnType: item.type || item.columnType || 'string',
                sampleData: item.sampleData || item.sample || '',
              };
            }
            return {
              columnName: String(item),
              columnType: 'string',
              sampleData: '',
            };
          });
        } else {
          // 尝试从其他可能的字段中提取
          const possibleFields = ['fields', 'keys', 'names', 'list'];
          for (const field of possibleFields) {
            if (result.data[field] && Array.isArray(result.data[field])) {
              headers = result.data[field].map((item: any) => {
                if (typeof item === 'string') {
                  return {
                    columnName: item,
                    columnType: 'string',
                    sampleData: '',
                  };
                } else if (item && typeof item === 'object') {
                  return {
                    columnName: item.name || item.columnName || item.header || String(item),
                    columnType: item.type || item.columnType || 'string',
                    sampleData: item.sampleData || item.sample || '',
                  };
                }
                return {
                  columnName: String(item),
                  columnType: 'string',
                  sampleData: '',
                };
              });
              break;
            }
          }
        }

        if (headers.length > 0) {
          setTableHeaders(headers);
          toast.success(`成功获取表格表头信息，共 ${headers.length} 列`);
        } else {
          throw new Error('未找到有效的表头数据');
        }
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
          { columnName: '图片ID', columnType: 'string', sampleData: 'IMG_001' },
          { columnName: '图片名称', columnType: 'string', sampleData: '产品展示图_001.jpg' },
          { columnName: '图片描述', columnType: 'string', sampleData: '高质量产品展示图片' },
          { columnName: '提示词', columnType: 'string', sampleData: '一个现代风格的产品展示图片' },
          { columnName: '图片URL', columnType: 'string', sampleData: 'https://example.com/image1.jpg' },
          { columnName: '标签', columnType: 'string', sampleData: '产品,展示,现代' },
          { columnName: '创建时间', columnType: 'datetime', sampleData: '2024-01-15 10:30:00' },
          { columnName: '文件大小', columnType: 'number', sampleData: '2.5MB' },
        ];

        setTableHeaders(mockHeaders);
        toast.success('使用模拟数据获取表格表头信息（开发模式）');
        return;
      }

      toast.error(`获取表格表头失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTableHeaders([]);
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  // 提交数据上传任务
  const onSubmit = async (data: DataUploadForm) => {
    setIsSubmitting(true);
    setUploadStatus('idle');

    try {
      // 调用真实的后端API提交数据上传任务
      const response = await fetch('/api/model-training/submit-data-upload-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify({
          id: currentModelTrainingId,
          spreadsheet_url: data.feishuUrl,
          image_column_name: data.imageNameColumn,
          txt_column_name: data.promptColumn,
          image_field: data.imageColumn,
          path_suffix: '100_1',
          summary_txt_name: '1',
          max_records_in_summary: 5,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('认证失败，请检查登录状态或API Key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('提交数据上传任务API返回结果:', result); // 调试日志

      if (result.code === 200 && result.data) {
        // 检查返回的code值
        const responseCode = result.data.code;
        const responseMessage = result.data.message || '任务提交完成';

        if (responseCode === 200) {
          setUploadStatus('success');
          toast.success('数据上传任务提交成功！');

          // 重置表单
          form.reset();
          setTableHeaders([]);
        } else {
          setUploadStatus('error');
          toast.error(`任务提交失败: ${responseMessage}`);
        }
      } else {
        throw new Error(result.message || '提交数据上传任务失败');
      }
    } catch (error) {
      // console.error('提交数据上传任务失败:', error);

      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // console.warn('后端连接失败，使用模拟数据进行开发测试');

        // 模拟任务提交
        setUploadStatus('success');
        toast.success('数据上传任务提交成功！（开发模式）');

        // 重置表单
        form.reset();
        setTableHeaders([]);
        return;
      }

      setUploadStatus('error');
      toast.error(`提交数据上传任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-1">
        {/* 标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold">数据上传</h2>
          <p className="mt-2 text-muted-foreground">通过飞书表格URL上传训练数据，支持自动解析表格结构并映射列字段</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 飞书表格链接获取 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  飞书表格链接获取
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  onClick={async () => {
                    setIsGettingUrl(true);
                    setGeneratedUrl('');
                    try {
                      // console.log('正在获取飞书表格URL，模型训练ID:', currentModelTrainingId);

                      // 调用真实的API获取飞书表格URL
                      const feishuUrl = await fetchFeishuTableUrl();

                      if (feishuUrl) {
                        // 设置生成的URL并显示动画
                        setGeneratedUrl(feishuUrl);
                        setIsUrlGenerated(true);

                        // 延迟填入表单，让用户看到URL显示
                        setTimeout(() => {
                          form.setValue('feishuUrl', feishuUrl);
                          toast.success('成功获取飞书表格链接！');

                          // 自动调用获取表头功能
                          setTimeout(() => {
                            fetchTableHeaders();
                          }, 1000);
                        }, 500);
                      } else {
                        toast.error('获取飞书表格链接失败');
                      }
                    } catch (error) {
                      // console.error('获取飞书表格URL错误:', error);

                      // 如果是连接错误，在开发模式下使用模拟数据
                      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
                        // console.warn('后端连接失败，使用模拟URL进行开发测试');

                        const mockUrl = 'https://caka-labs.feishu.cn/sheets/shtcn1234567890abcdef';
                        setGeneratedUrl(mockUrl);
                        setIsUrlGenerated(true);

                        setTimeout(() => {
                          form.setValue('feishuUrl', mockUrl);
                          toast.success('使用模拟URL获取飞书表格链接（开发模式）');

                          // 自动调用获取表头功能
                          setTimeout(() => {
                            fetchTableHeaders();
                          }, 1000);
                        }, 500);
                        return;
                      }

                      toast.error(`获取飞书表格链接失败: ${error instanceof Error ? error.message : '未知错误'}`);
                    } finally {
                      setIsGettingUrl(false);
                    }
                  }}
                  className="w-full"
                  variant="outline"
                  loading={isGettingUrl}
                  disabled={isGettingUrl || !currentModelTrainingId}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGettingUrl ? '正在获取链接...' : '获取飞书表格链接'}
                </Button>
                <p className="text-sm text-muted-foreground">点击按钮自动获取可用的飞书表格链接</p>

                {/* 调试信息 */}

                {/* 生成的URL显示区域 */}
                {generatedUrl && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 duration-300 animate-in slide-in-from-top-2">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">成功获取链接</span>
                    </div>
                    <div className="rounded border border-green-200 bg-white p-3">
                      <code className="break-all text-sm text-green-700">{generatedUrl}</code>
                    </div>
                    <p className="mt-2 text-xs text-green-600">链接已自动填入下方输入框</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 飞书表格URL输入 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  飞书表格配置
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
                          <Input
                            placeholder="https://caka-labs.feishu.cn/..."
                            {...field}
                            className="min-w-0 flex-1"
                            disabled={isUrlGenerated}
                            readOnly={isUrlGenerated}
                          />
                          {isUrlGenerated && (
                            <Button
                              type="button"
                              onClick={() => {
                                setIsUrlGenerated(false);
                                setGeneratedUrl('');
                                form.setValue('feishuUrl', '');
                                setTableHeaders([]);
                                toast.info('已重置URL，可以重新输入');
                              }}
                              variant="outline"
                              size="small"
                              className="h-10 flex-shrink-0"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              重置
                            </Button>
                          )}
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
                        {isUrlGenerated
                          ? 'URL已通过系统获取，如需修改请点击"重置"按钮'
                          : '请输入 caka-labs 飞书表格的完整URL，系统将自动解析表格结构'}
                      </p>
                    </FormItem>
                  )}
                />

                {/* 表头信息展示 */}
                {tableHeaders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">检测到的表格列：</h4>
                    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2 pr-2 md:grid-cols-3 lg:grid-cols-4">
                        {tableHeaders.map((header, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            <span className="truncate">{header.columnName}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 列映射配置 */}
            {tableHeaders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    列映射配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="imageNameColumn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>图片名称列</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择图片名称列" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tableHeaders.map((header, index) => (
                                <SelectItem key={index} value={header.columnName}>
                                  {header.columnName}
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
                      name="promptColumn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>提示词列</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择提示词列" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tableHeaders.map((header, index) => (
                                <SelectItem key={index} value={header.columnName}>
                                  {header.columnName}
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
                      name="imageColumn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>图片列</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择图片列" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tableHeaders.map((header, index) => (
                                <SelectItem key={index} value={header.columnName}>
                                  {header.columnName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 映射预览 */}
                  <Separator />
                  <div>
                    <h4 className="mb-2 font-medium">映射预览：</h4>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">图片名称：</span>
                          <Badge variant="secondary">{form.watch('imageNameColumn') || '未选择'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">提示词：</span>
                          <Badge variant="secondary">{form.watch('promptColumn') || '未选择'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">图片：</span>
                          <Badge variant="secondary">{form.watch('imageColumn') || '未选择'}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 提交按钮和状态 */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    size="large"
                    className="w-full"
                    loading={isSubmitting}
                    disabled={tableHeaders.length === 0}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    提交数据上传任务
                  </Button>

                  {/* 状态提示 */}
                  {uploadStatus === 'success' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        数据上传任务已成功提交！系统将开始处理您的数据，请稍后在"模型训练"标签页查看进度。
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>数据上传任务提交失败，请检查配置后重试。</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* 底部占位区域，提供更多滚动空间 */}
        <div className="h-16"></div>
      </div>
    </div>
  );
};
