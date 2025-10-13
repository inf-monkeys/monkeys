import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Download, Link, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

  const form = useForm<DataUploadForm>({
    resolver: zodResolver(dataUploadSchema),
    defaultValues: {
      feishuUrl: '',
      imageNameColumn: '',
      promptColumn: '',
      imageColumn: '',
    },
  });

  // 验证URL是否为飞书表格URL
  const isValidFeishuUrl = (url: string): boolean => {
    const feishuPattern = /^https:\/\/caka-labs\.feishu\.cn\//i;
    return feishuPattern.test(url);
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
      // 模拟API调用 - 这里应该调用实际的后端API
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      toast.success('成功获取表格表头信息');
    } catch (error) {
      toast.error('获取表格表头失败，请检查URL是否正确');
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
      // 模拟API调用 - 这里应该调用实际的后端API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('提交数据上传任务:', {
        modelTrainingId,
        feishuUrl: data.feishuUrl,
        columnMapping: {
          imageName: data.imageNameColumn,
          prompt: data.promptColumn,
          image: data.imageColumn,
        },
      });

      setUploadStatus('success');
      toast.success('数据上传任务提交成功！');

      // 重置表单
      form.reset();
      setTableHeaders([]);
    } catch (error) {
      setUploadStatus('error');
      toast.error('数据上传任务提交失败，请重试');
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
                      // 模拟API调用获取飞书表格URL
                      await new Promise((resolve) => setTimeout(resolve, 2000));

                      // 模拟返回的飞书表格URL
                      const mockUrl = `https://caka-labs.feishu.cn/sheets/shtcn${Date.now()}`;

                      // 设置生成的URL并显示动画
                      setGeneratedUrl(mockUrl);

                      // 延迟填入表单，让用户看到URL显示
                      setTimeout(() => {
                        form.setValue('feishuUrl', mockUrl);
                        toast.success('成功获取飞书表格链接！');
                      }, 500);
                    } catch (error) {
                      toast.error('获取飞书表格链接失败，请重试');
                    } finally {
                      setIsGettingUrl(false);
                    }
                  }}
                  className="w-full"
                  variant="outline"
                  loading={isGettingUrl}
                  disabled={isGettingUrl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGettingUrl ? '正在获取链接...' : '获取飞书表格链接'}
                </Button>
                <p className="text-sm text-muted-foreground">点击按钮自动获取可用的飞书表格链接</p>

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
                    <div className="space-y-2 rounded-lg bg-muted/50 p-4">
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
