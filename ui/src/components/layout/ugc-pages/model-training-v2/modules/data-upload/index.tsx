import React, { useEffect, useMemo, useRef, useState } from 'react';

import useSWR from 'swr';

import { Meta, Uppy, UppyFile } from '@uppy/core';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { CheckCircle, Clock, MoreHorizontal, Play, Plus, RefreshCw, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import qs from 'qs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher';
import { IMediaData } from '@/apis/media-data/typings';
import { useGetModelTraining } from '@/apis/model-training';
import { IPaginationListData } from '@/apis/typings';
import { createTag, updateAssetTag, useAssetTagList } from '@/apis/ugc';
import { IAssetItem, IAssetTag, IListUgcDto } from '@/apis/ugc/typings';
import { vinesHeader } from '@/apis/utils';
import { paginationWrapper } from '@/apis/wrapper';
import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { usePagination } from '@/hooks/use-pagination';
import { getI18nContent } from '@/utils';

// 数据上传任务状态接口
interface UploadTaskStatus {
  model_training_id: string;
  status: string | number;
  status_message?: string;
  message?: string; // 当status为"not_found"时，后端可能返回message字段
  total_files: number;
  downloaded_files: number;
  task_id?: string;
  created_time?: string;
  updated_time?: string;
}

interface IDataUploadModuleProps {
  modelTrainingId: string;
}

export const DataUploadModule: React.FC<IDataUploadModuleProps> = ({ modelTrainingId }) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const uppyRef = useRef<Uppy<Meta, Record<string, never>> | null>(null);
  const uploadedFileIdsRef = useRef<string[]>([]);
  const requiredTagsRef = useRef<IAssetTag[]>([]);

  const { data: modelTraining } = useGetModelTraining(modelTrainingId);
  const { data: allTags, mutate: mutateTags } = useAssetTagList();
  const [defaultTags, setDefaultTags] = useState<IAssetTag[]>([]); // 默认的3个标签
  const [filterTags, setFilterTags] = useState<IAssetTag[]>([]); // 当前用于筛选的标签（可编辑）
  const [tagSelectorVisible, setTagSelectorVisible] = useState(false);
  const [tagFilterPanelVisible, setTagFilterPanelVisible] = useState(false);
  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const tagSelectorTriggerRef = useRef<HTMLDivElement>(null);
  const [tagSearchValue, setTagSearchValue] = useState('');

  // 数据上传任务状态
  const [uploadTaskStatus, setUploadTaskStatus] = useState<UploadTaskStatus | null>(null);
  const [isLoadingUploadTask, setIsLoadingUploadTask] = useState(false);

  // 开始上传确认对话框
  const [showUploadConfirmDialog, setShowUploadConfirmDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 使用 AND 逻辑查询媒体文件
  const tagIds = filterTags.map((tag) => tag.id);

  // 构建查询参数，使用 AND 逻辑
  const queryDto: IListUgcDto = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      filter: tagIds.length > 0 ? { tagIds, tagIdsAnd: true } : undefined,
    }),
    [currentPage, pageSize, tagIds],
  );

  // 手动构建查询URL，确保 tagIdsAnd 参数正确传递
  const swrUrl = useMemo(() => {
    if (tagIds.length === 0) return null;
    const baseUrl = '/api/media-files';
    const url = `${baseUrl}?filterNeuralModel=exclude`;
    // 使用 indices 格式生成 filter[tagIds][0], filter[tagIds][1] 等格式
    const queryString = qs.stringify(queryDto, { encode: false, arrayFormat: 'indices' });
    return `${url}&${queryString}`;
  }, [queryDto, tagIds.length]);

  // 使用自定义的 SWR hook 查询
  const {
    data: mediaFilesData,
    isLoading,
    mutate,
  } = useSWR<IPaginationListData<IAssetItem<IMediaData>> | undefined>(
    swrUrl,
    vinesFetcher({ wrapper: paginationWrapper }),
  );

  // 确保3个默认标签存在
  const ensureDefaultTags = async (): Promise<IAssetTag[]> => {
    if (!modelTraining) return [];

    const requiredTagNames = [
      '模型训练2.0',
      getI18nContent(modelTraining.displayName) || '未命名模型训练',
      modelTrainingId,
    ];

    const tags: IAssetTag[] = [];

    for (const tagName of requiredTagNames) {
      // 先查找是否已存在
      let tag = allTags?.find((t) => t.name === tagName);
      if (!tag) {
        // 如果不存在，创建标签
        try {
          tag = await createTag(tagName);
          if (tag) {
            // 刷新标签列表，并更新 allTags
            const updatedTags = await mutateTags();
            // 从更新后的标签列表中查找新创建的标签
            if (updatedTags) {
              tag = updatedTags.find((t) => t.name === tagName) || tag;
            }
          }
        } catch (error) {
          console.error(`创建标签失败: ${tagName}`, error);
          toast.error(`创建标签失败: ${tagName}`);
        }
      }
      if (tag) {
        tags.push(tag);
      }
    }

    // 确保返回3个标签，如果不够则返回空数组（避免部分标签缺失导致筛选错误）
    return tags.length === 3 ? tags : [];
  };

  // 初始化时确保默认标签存在，并加载保存的标签筛选
  useEffect(() => {
    if (modelTraining && allTags) {
      void ensureDefaultTags().then(async (tags) => {
        if (tags.length === 3) {
          // 确保3个标签都获取到了再设置
          setDefaultTags(tags);
          requiredTagsRef.current = tags;

          // 先使用默认标签
          if (filterTags.length === 0) {
            setFilterTags(tags);
          }

          // 然后尝试加载保存的标签筛选
          try {
            const response = await fetch('/api/model-training/get-training-config', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...vinesHeader({ useToast: false }),
              },
              body: JSON.stringify({
                id: modelTrainingId,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.code === 200 && result.data) {
                const config = result.data;
                // 如果存在保存的标签筛选
                if (
                  config.data_upload_tag_ids &&
                  Array.isArray(config.data_upload_tag_ids) &&
                  config.data_upload_tag_ids.length > 0
                ) {
                  // 根据保存的标签ID查找标签对象
                  const savedTags = config.data_upload_tag_ids
                    .map((tagId: string) => allTags?.find((t) => t.id === tagId))
                    .filter((tag: IAssetTag | undefined) => tag !== undefined) as IAssetTag[];

                  // 如果找到了保存的标签，切换到保存的标签（但确保包含默认的3个标签）
                  if (savedTags.length > 0) {
                    // 合并默认标签和保存的标签，去重
                    const mergedTags = [...tags];
                    savedTags.forEach((savedTag) => {
                      if (!mergedTags.find((t) => t.id === savedTag.id)) {
                        mergedTags.push(savedTag);
                      }
                    });
                    // 延迟切换，让用户先看到默认标签
                    setTimeout(() => {
                      setFilterTags(mergedTags);
                    }, 500);
                  }
                }
              }
            }
          } catch (error) {
            console.warn('加载保存的标签筛选失败:', error);
            // 不影响主流程，只记录警告
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelTraining, allTags, modelTrainingId]);

  // 重置为默认标签
  const handleResetTags = () => {
    if (defaultTags.length === 3) {
      setFilterTags([...defaultTags]);
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 检查是否是"模型训练2.0"标签（不能删除）
  const isRequiredTag = (tag: IAssetTag) => tag.name === '模型训练2.0';

  // 处理标签选择器的标签点击
  const handleTagSelectorTagClick = (tagId: string) => {
    const index = filterTags.findIndex((t) => t.id === tagId);
    if (index === -1) {
      const tag = allTags?.find((x) => x.id === tagId);
      if (tag) {
        setFilterTags([...filterTags, tag]);
        setCurrentPage(1); // 重置到第一页
      }
    } else {
      // 如果是"模型训练2.0"标签，不能删除
      const tag = filterTags[index];
      if (!isRequiredTag(tag)) {
        setFilterTags(filterTags.filter((t) => t.id !== tagId));
        setCurrentPage(1); // 重置到第一页
      }
    }
  };

  // 处理标签移除
  const handleRemoveFilterTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tag = filterTags.find((t) => t.id === tagId);
    if (tag && !isRequiredTag(tag)) {
      setFilterTags(filterTags.filter((t) => t.id !== tagId));
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 处理标签搜索回车
  const handleTagSearchEnterPress = async () => {
    if (!tagSearchValue.trim()) return;
    const tag = allTags?.find((x) => x.name === tagSearchValue);
    if (!tag) {
      try {
        const tagCreated = await createTag(tagSearchValue);
        if (tagCreated) {
          // 刷新标签列表
          await mutateTags();
          // 自动添加到筛选标签
          const exists = filterTags.find((t) => t.id === tagCreated.id);
          if (!exists) {
            setFilterTags([...filterTags, tagCreated]);
            setCurrentPage(1); // 重置到第一页
          }
          setTagSearchValue('');
        }
      } catch (error) {
        console.error('Failed to create tag:', error);
      }
    } else {
      handleTagSelectorTagClick(tag.id);
      setTagSearchValue('');
    }
  };

  // 点击外部关闭标签选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagSelectorRef.current &&
        !tagSelectorRef.current.contains(event.target as Node) &&
        tagSelectorTriggerRef.current &&
        !tagSelectorTriggerRef.current.contains(event.target as Node)
      ) {
        setTagSelectorVisible(false);
      }
    };

    if (tagSelectorVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [tagSelectorVisible]);

  const searchedTags =
    allTags?.filter((t) =>
      tagSearchValue && tagSearchValue !== ''
        ? t.name.includes(tagSearchValue) || t._pinyin?.includes(tagSearchValue)
        : true,
    ) || [];

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
      // 如果是连接错误，在开发模式下使用模拟数据
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        // 模拟数据上传任务状态
        setUploadTaskStatus({
          model_training_id: modelTrainingId,
          status: '0',
          status_message: '无任务',
          total_files: 0,
          downloaded_files: 0,
        });
        return;
      }

      toast.error(`获取数据上传任务状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingUploadTask(false);
    }
  };

  // 获取数据上传任务状态显示文本
  const getUploadTaskStatusText = (status: string | number | undefined, statusMessage?: string, message?: string) => {
    // 优先使用message字段（当status为"not_found"时）
    if (message) return message;
    if (statusMessage) return statusMessage;
    if (status === null || status === undefined) return '无任务';
    const statusStr = String(status);
    if (statusStr === 'not_found') return '未找到任务';
    if (statusStr === '-1' || statusStr === '3') return '已完成';
    if (statusStr === '0') return '等待中';
    if (statusStr === '1' || statusStr === '2') return '进行中';
    return `状态: ${status}`;
  };

  // 获取数据上传任务状态颜色
  const getUploadTaskStatusColor = (status: string | number | undefined) => {
    if (status === null || status === undefined) return 'bg-gray-100 text-gray-800';
    const statusStr = String(status);
    if (statusStr === '-1' || statusStr === '3') return 'bg-green-100 text-green-800';
    if (statusStr === '0') return 'bg-yellow-100 text-yellow-800';
    if (statusStr === '1' || statusStr === '2') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // 组件挂载时获取上传任务状态
  useEffect(() => {
    fetchUploadTaskStatus();
  }, [modelTrainingId]);

  // 判断是否可以开始上传（只有当status为"not_found"时才可以）
  const canStartUpload = useMemo(() => {
    if (!uploadTaskStatus) return true; // 如果没有状态信息，允许上传
    const status = String(uploadTaskStatus.status);
    return status === 'not_found';
  }, [uploadTaskStatus]);

  // 处理开始上传按钮点击
  const handleStartUploadClick = () => {
    if (!canStartUpload) {
      const status = uploadTaskStatus?.status;
      const statusStr = String(status);
      if (statusStr === '-1' || statusStr === '3') {
        toast.error('数据上传已完成');
      } else if (statusStr === '0' || statusStr === '1' || statusStr === '2') {
        toast.error('数据上传任务正在进行中，请等待完成后再试');
      } else {
        toast.error('当前状态不允许开始上传');
      }
      return;
    }
    setShowUploadConfirmDialog(true);
  };

  // 开始上传
  const handleStartUpload = async () => {
    if (!modelTraining) {
      toast.error('模型训练信息不存在');
      return;
    }

    if (tagIds.length === 0) {
      toast.error('请先选择筛选标签');
      return;
    }

    setIsUploading(true);
    try {
      // 获取模型训练名称
      const projectName = getI18nContent(modelTraining.displayName) || '未命名模型训练';

      // 构建请求数据
      const requestData = {
        modelTrainingId,
        projectName,
        tagIds,
      };

      // 发送请求到后端
      const response = await fetch('/api/model-training/start-data-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200) {
        // 保存标签筛选到 config_v2 的 data 字段
        try {
          const saveTagResponse = await fetch('/api/model-training/save-training-config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...vinesHeader({ useToast: true }),
            },
            body: JSON.stringify({
              id: modelTrainingId,
              data_upload_tag_ids: tagIds, // 保存标签ID数组
            }),
          });

          if (saveTagResponse.ok) {
            const saveTagResult = await saveTagResponse.json();
            if (saveTagResult.code !== 200) {
              console.warn('保存标签筛选失败:', saveTagResult.message);
            }
          }
        } catch (error) {
          console.warn('保存标签筛选时出错:', error);
          // 不影响主流程，只记录警告
        }

        toast.success('数据上传任务已提交');
        setShowUploadConfirmDialog(false);
        // 刷新上传任务状态
        await fetchUploadTaskStatus();
      } else {
        throw new Error(result.message || '上传任务提交失败');
      }
    } catch (error) {
      console.error('开始上传失败:', error);
      toast.error(`开始上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理上传成功事件
  const handleUploadSuccessRef = useRef<
    ((file: UppyFile<Meta, Record<string, never>> | undefined, response: any) => void) | null
  >(null);

  if (!handleUploadSuccessRef.current) {
    handleUploadSuccessRef.current = (file: UppyFile<Meta, Record<string, never>> | undefined, response: any) => {
      if (!file || !response) return;
      const mediaFileId =
        (response as any)?.body?.data?.id || file.meta?.mediaFileId || (response as any)?.body?.data?.mediaFileId;
      if (mediaFileId) {
        if (!uploadedFileIdsRef.current.includes(mediaFileId)) {
          uploadedFileIdsRef.current.push(mediaFileId);
        }
      }
    };
  }

  // 处理文件上传完成
  const handleUploadChange = async (urls: string[], files: UppyFile<Meta, Record<string, never>>[]) => {
    // 等待一段时间，确保 upload-success 事件已经触发
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 获取上传的文件ID
    let uploadedFileIds = [...uploadedFileIdsRef.current];

    // 如果 uppy 实例可用，从 uppy 获取最新的文件状态作为补充
    if (uppyRef.current && uploadedFileIds.length === 0) {
      const uppyFiles = uppyRef.current.getFiles();
      uploadedFileIds = uppyFiles
        .map((file) => {
          const mediaFileId =
            (file.response as any)?.body?.data?.id ||
            file.meta?.mediaFileId ||
            (file.response as any)?.body?.data?.mediaFileId ||
            (file.response as any)?.data?.id;
          return mediaFileId;
        })
        .filter((id): id is string => !!id);
    }

    // 如果还是失败，尝试从传入的 files 参数获取
    if (uploadedFileIds.length === 0) {
      uploadedFileIds = files
        .map((file) => {
          const mediaFileId =
            (file.response as any)?.body?.data?.id ||
            file.meta?.mediaFileId ||
            (file.response as any)?.body?.data?.mediaFileId ||
            (file.response as any)?.data?.id;
          return mediaFileId;
        })
        .filter((id): id is string => !!id);
    }

    // 确保默认标签存在（用于上传时添加标签）
    const tags = await ensureDefaultTags();
    requiredTagsRef.current = tags;
    if (tags.length === 3) {
      setDefaultTags(tags);
    }

    // 给上传的文件添加3个默认标签
    if (tags.length > 0 && uploadedFileIds.length > 0) {
      const tagIds = tags.map((tag) => tag.id);
      try {
        await Promise.all(uploadedFileIds.map((mediaFileId) => updateAssetTag('media-file', mediaFileId, { tagIds })));
        toast.success('文件标签添加成功');
        // 刷新文件列表
        await mutate();
      } catch (error) {
        console.error('[DataUploadModule] 标签更新失败:', error);
        toast.error('文件标签添加失败');
      }
    } else {
      // 即使没有标签，也刷新列表
      await mutate();
    }
  };

  const mediaFiles = mediaFilesData?.data || [];
  const totalCount = mediaFilesData?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 使用分页 hook
  const paginationState = usePagination({
    total: totalPages,
    page: currentPage,
    onChange: (page) => {
      setCurrentPage(page);
    },
  });

  // 判断是否为文本文件
  const isTextFile = (file: IAssetItem<IMediaData>) => {
    const fileName = getI18nContent(file.displayName) || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(extension || '');
  };

  // 删除文件的函数
  const deleteFile = async (fileId: string) => {
    return vinesFetcher({ method: 'DELETE' })(`/api/media-files/${fileId}`);
  };

  // 处理单个文件删除
  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      toast.success('文件删除成功');

      // 如果当前页只剩一个文件，删除后跳转到上一页
      if (mediaFiles.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }

      await mutate();
      // 从选中列表中移除
      setSelectedFileIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } catch (error) {
      console.error('[DataUploadModule] 删除文件失败:', error);
      toast.error('文件删除失败');
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0) {
      toast.warning('请先选择要删除的文件');
      return;
    }

    try {
      const deletePromises = Array.from(selectedFileIds).map((fileId) => deleteFile(fileId));
      await Promise.all(deletePromises);
      toast.success(`成功删除 ${selectedFileIds.size} 个文件`);

      // 如果删除后当前页没有文件了，跳转到上一页
      const remainingCount = mediaFiles.length - selectedFileIds.size;
      if (remainingCount === 0 && currentPage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }

      await mutate();
      setSelectedFileIds(new Set());
    } catch (error) {
      console.error('[DataUploadModule] 批量删除失败:', error);
      toast.error('批量删除失败');
    }
  };

  // 切换文件选中状态
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFileIds.size === mediaFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(mediaFiles.map((f) => f.id)));
    }
  };

  // 页面变化时重置选中状态
  useEffect(() => {
    setSelectedFileIds(new Set());
  }, [currentPage]);

  // 每页数量变化时，重置到第一页
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  // 退出选择模式
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedFileIds(new Set());
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {/* 工具栏 */}
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">数据上传</h2>
          {isSelectionMode && (
            <span className="text-sm text-muted-foreground">
              {selectedFileIds.size > 0 ? `已选择 ${selectedFileIds.size} 个文件` : '请选择文件'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              {selectedFileIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="small" icon={<Trash2 />}>
                      批量删除 ({selectedFileIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除选中的 {selectedFileIds.size} 个文件吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBatchDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="small" icon={<X />} onClick={exitSelectionMode}>
                取消选择
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="small"
                icon={<Play className="h-4 w-4" />}
                onClick={handleStartUploadClick}
                disabled={tagIds.length === 0 || !canStartUpload || isUploading}
                loading={isUploading}
              >
                开始上传
              </Button>
              {mediaFiles.length > 0 && (
                <Button variant="outline" size="small" onClick={() => setIsSelectionMode(true)}>
                  选择
                </Button>
              )}
              <Button variant="outline" size="small" onClick={() => setTagFilterPanelVisible(!tagFilterPanelVisible)}>
                {tagFilterPanelVisible ? '隐藏标签筛选' : '标签筛选'}
              </Button>
              <Button
                variant="outline"
                size="small"
                icon={<RefreshCw />}
                onClick={() => {
                  void mutate();
                }}
              >
                刷新
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="small" icon={<Upload />}>
                    上传文件
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[40rem] max-w-[40rem]">
                  <DialogHeader>
                    <DialogTitle>上传文件</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <VinesUploader
                      maxSize={30}
                      accept={['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp', 'txt']}
                      onChange={handleUploadChange}
                      basePath="user-files/model-training-v2"
                      uppy$={
                        new (class extends EventEmitter<Uppy<Meta, Record<string, never>>> {
                          emit = (value: Uppy<Meta, Record<string, never>>) => {
                            uppyRef.current = value;
                            uploadedFileIdsRef.current = [];
                            if (handleUploadSuccessRef.current) {
                              value.on('upload-success', handleUploadSuccessRef.current);
                            }
                            // 添加文件类型校验，只允许图片和txt文件
                            value.on('file-added', (file) => {
                              const fileName = file.name || '';
                              const extension = fileName.split('.').pop()?.toLowerCase() || '';
                              const allowedExtensions = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp', 'txt'];
                              const isImage = file.type?.startsWith('image/');
                              const isTxt = extension === 'txt' || file.type === 'text/plain';

                              if (!allowedExtensions.includes(extension) && !isImage && !isTxt) {
                                toast.error(`文件类型不支持，仅允许上传图片和txt文件`);
                                value.removeFile(file.id);
                                return;
                              }
                            });
                            return this;
                          };
                        })()
                      }
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* 标签选择器面板 */}
      {tagFilterPanelVisible && (
        <div className="flex flex-shrink-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">筛选标签：</span>
            <div className="relative flex-1">
              {/* 标签选择器触发器 */}
              <div
                ref={tagSelectorTriggerRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setTagSelectorVisible(!tagSelectorVisible);
                }}
                className="flex min-h-[2rem] cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:border-input/80"
              >
                {filterTags && filterTags.length > 0 ? (
                  <>
                    {filterTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          isRequiredTag(tag)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {tag.name}
                        {!isRequiredTag(tag) && (
                          <X
                            size={12}
                            className="cursor-pointer hover:text-primary/80"
                            onClick={(e) => handleRemoveFilterTag(tag.id, e)}
                          />
                        )}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Plus size={14} />
                    <span>点击选择标签</span>
                  </span>
                )}
              </div>

              {/* 标签选择器弹出层 */}
              {tagSelectorVisible && (
                <div
                  ref={tagSelectorRef}
                  className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-3 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 搜索输入框 */}
                  <Input
                    type="text"
                    placeholder="搜索或创建标签..."
                    value={tagSearchValue}
                    onChange={(value) => setTagSearchValue(value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleTagSearchEnterPress();
                      }
                    }}
                    className="mb-3"
                  />

                  {/* 标签列表 */}
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {searchedTags.length > 0 ? (
                      searchedTags.map((tag) => {
                        const selected = filterTags.find((t) => t.id === tag.id);
                        const isRequired = isRequiredTag(tag);
                        return (
                          <div
                            key={tag.id}
                            onClick={() => handleTagSelectorTagClick(tag.id)}
                            className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${
                              selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'
                            } ${isRequired && selected ? 'cursor-not-allowed opacity-75' : ''}`}
                          >
                            <span>{tag.name}</span>
                            {selected && <CheckCircle size={14} className="text-primary" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
                        暂无标签
                      </div>
                    )}
                  </div>

                  {/* 关闭按钮 */}
                  <div className="mt-3 flex justify-end border-t pt-2">
                    <Button variant="ghost" size="small" onClick={() => setTagSelectorVisible(false)}>
                      关闭
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="small"
              icon={<RotateCcw />}
              onClick={handleResetTags}
              disabled={defaultTags.length !== 3}
            >
              重置
            </Button>
          </div>
        </div>
      )}

      {/* 文件列表 */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : tagIds.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">请选择筛选标签</p>
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">暂无文件，请先上传</p>
          </div>
        ) : (
          <>
            {/* 全选按钮（仅在选择模式下显示） */}
            {isSelectionMode && mediaFiles.length > 0 && (
              <div className="mb-2 flex flex-shrink-0 items-center gap-2">
                <Checkbox
                  checked={selectedFileIds.size === mediaFiles.length && mediaFiles.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">全选</span>
              </div>
            )}

            <div className="grid grid-cols-8 gap-4">
              {mediaFiles.map((file: IAssetItem<IMediaData>) => {
                const isSelected = selectedFileIds.has(file.id);
                const isText = isTextFile(file);

                return (
                  <div
                    key={file.id}
                    className={`group relative aspect-square overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                      if (isSelectionMode) {
                        e.stopPropagation();
                        toggleFileSelection(file.id);
                      }
                    }}
                  >
                    {/* 选中复选框（仅在选择模式下显示） */}
                    {isSelectionMode && (
                      <div className="absolute left-2 top-2 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* 右下角操作按钮（三个点） */}
                    <div className="absolute bottom-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="small"
                            variant="outline"
                            className="h-6 w-6 rounded-full bg-white/90 p-0 shadow-md hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-10"
                                onSelect={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                                  <Trash2 size={15} />
                                </DropdownMenuShortcut>
                                删除
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                                  确定要删除文件 "{getI18nContent(file.displayName)}" 吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void handleDeleteFile(file.id)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* 文件内容 */}
                    {file.type?.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={getI18nContent(file.displayName)}
                        className="h-full w-full object-cover"
                      />
                    ) : isText ? (
                      <div className="h-full w-full overflow-hidden bg-muted">
                        <AssetContentPreview asset={file} isThumbnail={true} className="h-full w-full" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <p className="text-sm text-muted-foreground">{getI18nContent(file.displayName)}</p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="truncate text-xs text-white">{getI18nContent(file.displayName)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 分页 */}
            <div className="mt-4 flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>共 {totalCount} 条</span>
                <span>第 {currentPage} 页</span>
                <span>每页</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="96">96</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => paginationState.previous()}
                    disabled={paginationState.active === 1}
                  >
                    &lt; 上一页
                  </Button>
                  {paginationState.range.map((item, index) =>
                    item === 'dots' ? (
                      <span key={index} className="px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={index}
                        variant={item === paginationState.active ? 'default' : 'outline'}
                        size="small"
                        onClick={() => paginationState.setPage(item)}
                        className="min-w-[2.5rem]"
                      >
                        {item}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => paginationState.next()}
                    disabled={paginationState.active === totalPages || totalPages === 0}
                  >
                    下一页 &gt;
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 数据上传进度 */}
      <div className="flex flex-shrink-0 flex-col gap-4">
        {/* 数据上传进度卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                数据上传进度
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
                    <Badge className={`px-3 py-1 ${getUploadTaskStatusColor(uploadTaskStatus.status)}`}>
                      {getUploadTaskStatusText(
                        uploadTaskStatus.status,
                        uploadTaskStatus.status_message,
                        uploadTaskStatus.message,
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">进度：</span>
                    <span className="text-sm font-medium">
                      {uploadTaskStatus.downloaded_files} / {uploadTaskStatus.total_files}
                    </span>
                  </div>
                </div>

                {uploadTaskStatus.total_files > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">任务进度</span>
                      <span className="font-medium">
                        {Math.round((uploadTaskStatus.downloaded_files / uploadTaskStatus.total_files) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${(uploadTaskStatus.downloaded_files / uploadTaskStatus.total_files) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {uploadTaskStatus.task_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">任务ID：</span>
                    <span className="text-sm font-medium">{uploadTaskStatus.task_id}</span>
                  </div>
                )}

                {uploadTaskStatus.created_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">创建时间：</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(uploadTaskStatus.created_time).toLocaleString()}
                    </div>
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
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>暂无数据上传任务</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部透明区域，确保滚动条可以滚动到底部 */}
        <div className="h-20 flex-shrink-0" />
      </div>

      {/* 开始上传确认对话框 */}
      <AlertDialog open={showUploadConfirmDialog} onOpenChange={setShowUploadConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开始上传</AlertDialogTitle>
            <AlertDialogDescription>
              确定要开始上传数据吗？系统将上传当前标签筛选下的所有文件到模型训练服务。
              <br />
              <br />
              <span className="font-medium">模型训练：</span>
              {getI18nContent(modelTraining?.displayName) || '未命名模型训练'}
              <br />
              <span className="font-medium">筛选标签：</span>
              {filterTags.map((tag) => tag.name).join('、') || '无'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUploading}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartUpload} disabled={isUploading}>
              {isUploading ? '上传中...' : '确认上传'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
