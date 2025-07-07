import React, { useCallback, useRef, useState } from 'react';

import { AlertCircle, FolderOpen, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import SparkMD5 from 'spark-md5';

import { createMediaFile, getResourceByMd5 } from '@/apis/resources';
import { VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { vinesHeader } from '@/apis/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils';

export interface EnhancedUploaderProps {
  className?: string;
  maxSize?: number; // 单个文件最大大小 (MB)
  maxFiles?: number; // 最大文件数量
  accept?: string[]; // 接受的文件类型
  basePath?: string;
  onChange?: (urls: string[]) => void;
  onProgress?: (progress: number, completed: number, total: number) => void;
  onAssetsCreated?: (assetIds: string[]) => void; // 新增：返回创建的asset IDs
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'checking' | 'uploading' | 'success' | 'error';
  url?: string;
  assetId?: string; // 新增：存储创建的asset ID
  isRapidUpload?: boolean; // 新增：标记是否为秒传
  md5?: string; // 新增：存储计算好的MD5
  error?: string;
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_CONCURRENT_UPLOADS = 10; // 最大并发上传数
const MAX_CONCURRENT_CHECKS = 10; // 最大并发秒传检查数

export const EnhancedUploader: React.FC<EnhancedUploaderProps> = ({
  className,
  maxSize = 30,
  maxFiles = 100,
  accept = ['jpg', 'jpeg', 'png', 'webp'],
  basePath = 'user-files/media',
  onChange,
  onProgress,
  onAssetsCreated,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadQueueRef = useRef<UploadingFile[]>([]);
  const checkQueueRef = useRef<UploadingFile[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const activeChecksRef = useRef<Set<string>>(new Set());

  // 过滤图片文件
  const filterImageFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const fileArray = Array.from(files);
      return fileArray.filter((file) => {
        // 检查文件类型
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
          return false;
        }

        // 检查文件大小
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(t('enhancedUploader.fileSizeError', { fileName: file.name, maxSize }));
          return false;
        }

        return true;
      });
    },
    [maxSize],
  );

  // 生成唯一文件名
  const generateUniqueFilename = (file: File): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const name = file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名
    const extension = file.name.split('.').pop() || '';
    return `${timestamp}_${randomId}_${name}.${extension}`;
  };

  // 计算文件MD5（使用SparkMD5库）
  const calculateMD5 = async (file: File): Promise<string> => {
    const chunkSize = 2097152; // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e?.target?.result;
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Failed to read file chunk'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(chunk);
      });

      spark.append(buffer);
    }

    return spark.end();
  };

  // 并发秒传检查处理器
  const processCheckQueue = useCallback(async () => {
    if (checkQueueRef.current.length === 0 || activeChecksRef.current.size >= MAX_CONCURRENT_CHECKS) {
      return;
    }

    const fileToCheck = checkQueueRef.current.shift();
    if (!fileToCheck) return;

    activeChecksRef.current.add(fileToCheck.id);

    // 更新状态为检查中
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === fileToCheck.id ? { ...f, status: 'checking' as const, progress: 5 } : f)),
    );

    try {
      // 1. 计算MD5
      const md5 = await calculateMD5(fileToCheck.file);

      setUploadingFiles((prev) => prev.map((f) => (f.id === fileToCheck.id ? { ...f, progress: 15, md5 } : f)));

      // 2. 检查是否可以秒传
      let isRapidUpload = false;
      let rapidUploadResult = null;

      try {
        const existingResource = await getResourceByMd5(md5);
        if (existingResource?.data?.url && existingResource?.data?.id) {
          isRapidUpload = true;
          rapidUploadResult = {
            url: existingResource.data.url,
            assetId: existingResource.data.id,
          };
        }
      } catch (error) {
        // 秒传失败，继续正常上传流程
        console.log('Rapid upload check failed, proceeding with normal upload');
      }

      if (isRapidUpload && rapidUploadResult) {
        // 秒传成功
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileToCheck.id
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  url: rapidUploadResult.url,
                  assetId: rapidUploadResult.assetId,
                  isRapidUpload: true,
                }
              : f,
          ),
        );
      } else {
        // 需要正常上传，加入上传队列
        const fileWithMd5 = { ...fileToCheck, md5, status: 'pending' as const, progress: 20 };
        setUploadingFiles((prev) => prev.map((f) => (f.id === fileToCheck.id ? fileWithMd5 : f)));
        uploadQueueRef.current.push(fileWithMd5);
        processUploadQueue();
      }
    } catch (error) {
      // 检查失败
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileToCheck.id
            ? {
                ...f,
                status: 'error' as const,
                progress: 0,
                error: error instanceof Error ? error.message : 'Check failed',
              }
            : f,
        ),
      );
    } finally {
      activeChecksRef.current.delete(fileToCheck.id);

      // 继续处理检查队列
      setTimeout(() => processCheckQueue(), 50);
    }
  }, []);

  // 上传单个文件到服务器（已有MD5）
  const uploadSingleFileWithMd5 = async (
    file: File,
    md5: string,
    updateProgress: (progress: number) => void,
  ): Promise<{ url: string; assetId: string; isRapidUpload: boolean }> => {
    try {
      // 1. 获取S3配置
      const configResponse = await fetch('/api/medias/s3/configs', {
        headers: vinesHeader({}),
      });
      const config = await configResponse.json();
      const { baseUrl, proxy } = config.data;

      // 2. 生成文件名
      const filename = generateUniqueFilename(file);
      const fullPath = `${basePath}/${filename}`;

      let uploadUrl: string;

      if (proxy) {
        // 使用代理上传
        const formData = new FormData();
        formData.append('key', fullPath);
        formData.append('file', file);

        const uploadResponse = await new Promise<{ data: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 80; // 0%-80%
              updateProgress(progress);
            }
          });

          xhr.onload = () => {
            if ([200, 201].includes(xhr.status)) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));

          xhr.open('POST', '/api/medias/s3/file');

          // 设置认证头
          const headers = vinesHeader({});
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.send(formData);
        });

        uploadUrl = uploadResponse.data || `${baseUrl}${fullPath}`;
      } else {
        // 使用预签名URL上传
        const presignResponse = await fetch(`/api/medias/s3/presign?key=${encodeURIComponent(fullPath)}`, {
          headers: vinesHeader({}),
        });
        const presignData = await presignResponse.json();
        const presignedUrl = presignData.data;

        // 上传到S3
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 80; // 0%-80%
              updateProgress(progress);
            }
          });

          xhr.onload = () => {
            if ([200, 201].includes(xhr.status)) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));

          xhr.open('PUT', presignedUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        uploadUrl = `${baseUrl}${fullPath}`;
      }

      updateProgress(80);

      // 3. 创建媒体文件记录
      const createdAsset = await createMediaFile({
        type: file.type as VinesResourceType,
        md5,
        displayName: file.name,
        source: VinesResourceSource.UPLOAD,
        url: uploadUrl,
        tags: [],
        categoryIds: [],
        size: file.size,
      });

      updateProgress(100);
      return { url: uploadUrl, assetId: createdAsset.id, isRapidUpload: false };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error instanceof Error ? error : new Error('Upload failed');
    }
  };

  // 并行上传处理器
  const processUploadQueue = useCallback(async () => {
    if (uploadQueueRef.current.length === 0 || activeUploadsRef.current.size >= MAX_CONCURRENT_UPLOADS) {
      return;
    }

    const fileToUpload = uploadQueueRef.current.shift();
    if (!fileToUpload) return;

    activeUploadsRef.current.add(fileToUpload.id);

    // 更新状态为上传中
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === fileToUpload.id ? { ...f, status: 'uploading' as const, progress: 0 } : f)),
    );

    try {
      if (!fileToUpload.md5) {
        throw new Error('MD5 not calculated');
      }

      const result = await uploadSingleFileWithMd5(fileToUpload.file, fileToUpload.md5, (progress) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileToUpload.id ? { ...f, progress: Math.min(20 + progress, 99) } : f)),
        );
      });

      // 上传成功
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileToUpload.id
            ? {
                ...f,
                status: 'success' as const,
                progress: 100,
                url: result.url,
                assetId: result.assetId,
                isRapidUpload: result.isRapidUpload,
              }
            : f,
        ),
      );
    } catch (error) {
      // 上传失败
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileToUpload.id
            ? {
                ...f,
                status: 'error' as const,
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f,
        ),
      );
    } finally {
      activeUploadsRef.current.delete(fileToUpload.id);

      // 继续处理队列
      setTimeout(() => processUploadQueue(), 100);
    }
  }, []);

  // 开始上传处理
  const startUploads = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      // 检查文件数量限制
      if (uploadingFiles.length + files.length > maxFiles) {
        toast.error(t('enhancedUploader.maxFilesError', { maxFiles }));
        return;
      }

      const newUploadingFiles: UploadingFile[] = files.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
      checkQueueRef.current.push(...newUploadingFiles);
      setIsUploading(true);

      // 启动并行秒传检查
      for (let i = 0; i < Math.min(MAX_CONCURRENT_CHECKS, newUploadingFiles.length); i++) {
        processCheckQueue();
      }
    },
    [uploadingFiles.length, maxFiles, processCheckQueue],
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const imageFiles = filterImageFiles(files);
      if (imageFiles.length > 0) {
        startUploads(imageFiles);
      }

      // 重置input
      event.target.value = '';
    },
    [filterImageFiles, startUploads],
  );

  // 处理文件夹选择
  const handleFolderSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const imageFiles = filterImageFiles(files);

      if (imageFiles.length === 0) {
        toast.error(t('enhancedUploader.noImagesInFolder'));
        return;
      }

      toast.success(t('enhancedUploader.foundImagesInFolder', { count: imageFiles.length }));
      startUploads(imageFiles);

      // 重置input
      event.target.value = '';
    },
    [filterImageFiles, startUploads],
  );

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    uploadQueueRef.current = uploadQueueRef.current.filter((f) => f.id !== fileId);
  }, []);

  // 重试上传
  const retryUpload = useCallback(
    (fileId: string) => {
      const file = uploadingFiles.find((f) => f.id === fileId);
      if (!file) return;

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'pending' as const, progress: 0, error: undefined, md5: undefined } : f,
        ),
      );

      checkQueueRef.current.push(file);
      processCheckQueue();
    },
    [uploadingFiles, processCheckQueue],
  );

  // 计算整体进度
  const overallProgress =
    uploadingFiles.length === 0 ? 0 : uploadingFiles.reduce((sum, f) => sum + f.progress, 0) / uploadingFiles.length;

  const completedCount = uploadingFiles.filter((f) => f.status === 'success').length;
  const errorCount = uploadingFiles.filter((f) => f.status === 'error').length;

  // 检查是否全部完成
  React.useEffect(() => {
    if (uploadingFiles.length > 0 && completedCount + errorCount === uploadingFiles.length) {
      setIsUploading(false);

      const successFiles = uploadingFiles.filter((f) => f.status === 'success' && f.url && f.assetId);
      const successUrls = successFiles.map((f) => f.url!);
      const successAssetIds = successFiles.map((f) => f.assetId!);

      // 统计秒传和正常上传的数量
      const rapidUploadCount = successFiles.filter((f) => f.isRapidUpload).length;
      const normalUploadCount = successFiles.length - rapidUploadCount;

      if (successUrls.length > 0) {
        onChange?.(successUrls);
        onAssetsCreated?.(successAssetIds);

        // 只有当没有 onAssetsCreated 回调时才显示上传完成提示
        // 避免与外部组件的提示重复
        if (!onAssetsCreated) {
          // 根据上传方式显示不同的提示
          if (rapidUploadCount > 0 && normalUploadCount > 0) {
            toast.success(
              t('enhancedUploader.uploadComplete.mixed', {
                normalCount: normalUploadCount,
                rapidCount: rapidUploadCount,
              }),
            );
          } else if (rapidUploadCount > 0) {
            toast.success(t('enhancedUploader.uploadComplete.rapidOnly', { rapidCount: rapidUploadCount }));
          } else {
            toast.success(t('enhancedUploader.uploadComplete.normalOnly', { count: successUrls.length }));
          }
        }
      }

      if (errorCount > 0) {
        toast.error(t('enhancedUploader.uploadErrors', { count: errorCount }));
      }
    }

    onProgress?.(overallProgress, completedCount, uploadingFiles.length);
  }, [uploadingFiles, completedCount, errorCount, onChange, onProgress, onAssetsCreated, overallProgress]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传按钮区域 */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-32 flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-8 w-8" />
          <span>{t('enhancedUploader.selectFiles')}</span>
          <span className="text-xs text-muted-foreground">
            {t('enhancedUploader.supportedFormats', { formats: accept.join(', ') })}
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex-col gap-2"
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
        >
          <FolderOpen className="h-8 w-8" />
          <span>{t('enhancedUploader.selectFolder')}</span>
          <span className="text-xs text-muted-foreground">{t('enhancedUploader.autoFilter')}</span>
        </Button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept.map((ext) => `.${ext}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: '' } as any)}
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* 上传进度概览 */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('enhancedUploader.uploadProgress', { completed: completedCount, total: uploadingFiles.length })}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {t('enhancedUploader.fileCount', { count: uploadingFiles.length })}
                    </Badge>
                    {completedCount > 0 && (
                      <Badge variant="default">{t('enhancedUploader.completed', { count: completedCount })}</Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge variant="destructive">{t('enhancedUploader.failed', { count: errorCount })}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Progress value={overallProgress} className="h-2" />

              {/* 文件列表 */}
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                      <ImageIcon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={file.progress} className="h-1 flex-1" />
                        <span className="w-12 text-xs text-muted-foreground">{file.progress.toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'success' && (
                        <Badge variant="default" className="text-xs">
                          {t('enhancedUploader.success')}
                        </Badge>
                      )}
                      {file.status === 'error' && (
                        <div className="flex items-center gap-1">
                          <Badge variant="destructive" className="text-xs">
                            {t('enhancedUploader.error')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryUpload(file.id)}
                            className="h-6 w-6 p-0"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
