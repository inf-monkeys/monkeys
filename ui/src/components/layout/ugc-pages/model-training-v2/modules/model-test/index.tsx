import React, { useEffect, useMemo, useRef, useState } from 'react';

import useSWR from 'swr';

import { CheckCircle, Download, Eye, FileText, Play, Plus, RefreshCw, RotateCcw, X } from 'lucide-react';
import qs from 'qs';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher';
import { IMediaData } from '@/apis/media-data/typings';
import {
  useGetDownloadableModel,
  useGetLoraModels,
  useGetModelTraining,
  useGetPretrainedModels,
} from '@/apis/model-training';
import { IPaginationListData } from '@/apis/typings';
import { createTag, useAssetTagList } from '@/apis/ugc';
import { IAssetItem, IAssetTag, IListUgcDto } from '@/apis/ugc/typings';
import { vinesHeader } from '@/apis/utils';
import { paginationWrapper } from '@/apis/wrapper';
import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePagination } from '@/hooks/use-pagination';
import { getI18nContent } from '@/utils';

interface IModelTestModuleProps {
  modelTrainingId: string;
}

export const ModelTestModule: React.FC<IModelTestModuleProps> = ({ modelTrainingId }) => {
  const { t } = useTranslation();
  const { icons, closeIcon } = useVinesImageManage();
  const [selectedLoraModels, setSelectedLoraModels] = useState<string[]>([]);
  const [pretrainedModel, setPretrainedModel] = useState<string>('');
  const [testMode, setTestMode] = useState<'default' | 'custom' | 'download'>('default');
  const [customInputs, setCustomInputs] = useState<string[]>(['']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: modelTraining } = useGetModelTraining(modelTrainingId);

  // 获取底模列表（model_type=2）
  const { data: pretrainedModels = [], isLoading: isLoadingPretrainedModels } = useGetPretrainedModels('2');

  // 获取Lora模型列表（model_type=1，需要model_training_id）
  const { data: loraModels = [], isLoading: isLoadingLoraModels } = useGetLoraModels(modelTrainingId);

  // 获取可下载模型信息
  const { data: downloadableModel, isLoading: isLoadingDownloadableModel } = useGetDownloadableModel(modelTrainingId);
  const [selectedDownloadModel, setSelectedDownloadModel] = useState<string>('');
  const { data: allTags, mutate: mutateTags } = useAssetTagList();
  const [defaultTags, setDefaultTags] = useState<IAssetTag[]>([]);
  const [filterTags, setFilterTags] = useState<IAssetTag[]>([]);
  const [tagSelectorVisible, setTagSelectorVisible] = useState(false);
  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const tagSelectorTriggerRef = useRef<HTMLDivElement>(null);
  const [tagSearchValue, setTagSearchValue] = useState('');
  const requiredTagsRef = useRef<IAssetTag[]>([]);
  const [loraModelTags, setLoraModelTags] = useState<IAssetTag[]>([]);

  // 获取训练配置中的pretrained_model，并设置默认值
  const pretrainedModelInitializedRef = useRef<string | null>(null);
  useEffect(() => {
    // 如果modelTrainingId变化，重置初始化标记
    if (pretrainedModelInitializedRef.current !== modelTrainingId) {
      pretrainedModelInitializedRef.current = null;
      setPretrainedModel('');
    }

    // 只在第一次加载时执行，避免重复设置
    if (pretrainedModelInitializedRef.current === modelTrainingId || pretrainedModels.length === 0) {
      return;
    }

    const fetchPretrainedModelFromConfig = async () => {
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
            // 优先使用配置中保存的pretrained_model
            if (
              config.pretrained_model &&
              typeof config.pretrained_model === 'string' &&
              config.pretrained_model.trim() !== ''
            ) {
              // 检查这个值是否在可用列表中
              if (pretrainedModels.includes(config.pretrained_model)) {
                setPretrainedModel(config.pretrained_model);
                pretrainedModelInitializedRef.current = modelTrainingId;
                return;
              }
            }
          }
        }
      } catch (error) {
        console.warn('获取训练配置中的底模失败:', error);
      }

      // 如果没有从配置中获取到，或者获取到的值不在列表中，使用列表中的第一个
      if (pretrainedModels.length > 0) {
        setPretrainedModel(pretrainedModels[0]);
        pretrainedModelInitializedRef.current = modelTrainingId;
      }
    };

    void fetchPretrainedModelFromConfig();
  }, [pretrainedModels, modelTrainingId]);

  // 确保默认标签存在（和数据上传使用相同的标签）
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
          // 不显示 toast，避免干扰用户体验
        }
      }
      if (tag) {
        tags.push(tag);
      }
    }

    // 确保返回3个标签，如果不够则返回空数组（避免部分标签缺失导致筛选错误）
    return tags.length === 3 ? tags : [];
  };

  // 当 Lora 模型列表加载完成后，创建对应的标签
  useEffect(() => {
    if (loraModels && loraModels.length > 0 && allTags) {
      const createLoraModelTags = async () => {
        const tags: IAssetTag[] = [];

        for (const modelName of loraModels) {
          // 先查找是否已存在
          let tag = allTags?.find((t) => t.name === modelName);
          if (!tag) {
            // 如果不存在，创建标签
            try {
              tag = await createTag(modelName);
              if (tag) {
                // 刷新标签列表，并更新 allTags
                const updatedTags = await mutateTags();
                // 从更新后的标签列表中查找新创建的标签
                if (updatedTags) {
                  tag = updatedTags.find((t) => t.name === modelName) || tag;
                }
              }
            } catch (error) {
              console.error(`创建 Lora 模型标签失败: ${modelName}`, error);
              // 不显示 toast，避免干扰用户体验
            }
          }
          if (tag) {
            tags.push(tag);
          }
        }

        setLoraModelTags(tags);
      };

      void createLoraModelTags();
    } else {
      setLoraModelTags([]);
    }
  }, [loraModels, allTags, mutateTags]);

  // 当可下载模型数据加载完成时，自动选择第一个模型
  useEffect(() => {
    if (downloadableModel && downloadableModel.length > 0 && !selectedDownloadModel) {
      setSelectedDownloadModel(downloadableModel[0].model_name);
    }
  }, [downloadableModel, selectedDownloadModel]);

  // 初始化标签
  useEffect(() => {
    if (modelTraining && allTags) {
      void ensureDefaultTags().then(async (tags) => {
        if (tags.length === 3) {
          setDefaultTags(tags);
          requiredTagsRef.current = tags;

          if (filterTags.length === 0) {
            setFilterTags(tags);
          }

          // 加载保存的标签筛选
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
                if (
                  config.data_upload_tag_ids &&
                  Array.isArray(config.data_upload_tag_ids) &&
                  config.data_upload_tag_ids.length > 0
                ) {
                  const savedTags = config.data_upload_tag_ids
                    .map((tagId: string) => allTags?.find((t) => t.id === tagId))
                    .filter((tag: IAssetTag | undefined) => tag !== undefined) as IAssetTag[];

                  if (savedTags.length > 0) {
                    const mergedTags = [...tags];
                    savedTags.forEach((savedTag) => {
                      if (!mergedTags.find((t) => t.id === savedTag.id)) {
                        mergedTags.push(savedTag);
                      }
                    });
                    setTimeout(() => {
                      setFilterTags(mergedTags);
                    }, 500);
                  }
                }
              }
            }
          } catch (error) {
            console.warn('加载保存的标签筛选失败:', error);
          }
        }
      });
    }
  }, [modelTraining, allTags, modelTrainingId]);

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

  const mediaFiles = mediaFilesData?.data || [];
  const totalPages = mediaFilesData?.total ? Math.ceil(mediaFilesData.total / pageSize) : 0;

  const paginationState = usePagination({
    total: totalPages,
    page: currentPage,
    onChange: (page) => {
      setCurrentPage(page);
    },
  });

  // 每页数量变化时，重置到第一页
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const totalCount = mediaFilesData?.total || 0;

  // 处理标签选择
  const handleTagSelectorTagClick = (tagId: string) => {
    const index = filterTags.findIndex((t) => t.id === tagId);
    if (index === -1) {
      const tag = allTags?.find((x) => x.id === tagId);
      if (tag) {
        setFilterTags([...filterTags, tag]);
        setCurrentPage(1);
      }
    } else {
      const tag = filterTags[index];
      if (!isRequiredTag(tag)) {
        setFilterTags(filterTags.filter((t) => t.id !== tagId));
        setCurrentPage(1);
      }
    }
  };

  const isRequiredTag = (tag: IAssetTag) => {
    return defaultTags.some((dt) => dt.id === tag.id);
  };

  const handleRemoveFilterTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tag = filterTags.find((t) => t.id === tagId);
    if (tag && !isRequiredTag(tag)) {
      setFilterTags(filterTags.filter((t) => t.id !== tagId));
      setCurrentPage(1);
    }
  };

  // 判断是否为文本文件
  const isTextFile = (file: IAssetItem<IMediaData>) => {
    const fileName = getI18nContent(file.displayName) || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(extension || '');
  };

  // 重置为默认标签
  const handleResetTags = () => {
    if (defaultTags.length === 3) {
      setFilterTags([...defaultTags]);
      setCurrentPage(1);
    }
  };

  // 处理自定义输入
  const handleCustomInputChange = (index: number, value: string) => {
    const newInputs = [...customInputs];
    newInputs[index] = value.replace(/\n/g, ''); // 移除换行符
    setCustomInputs(newInputs);
  };

  const handleAddCustomInput = () => {
    if (customInputs.length < 20) {
      setCustomInputs([...customInputs, '']);
    }
  };

  const handleRemoveCustomInput = (index: number) => {
    if (customInputs.length > 1) {
      const newInputs = customInputs.filter((_, i) => i !== index);
      setCustomInputs(newInputs);
    }
  };

  // 开始测试
  const handleStartTest = async (isCustom: boolean) => {
    if (selectedLoraModels.length === 0) {
      toast.error('请至少选择一个 Lora 模型');
      return;
    }

    if (!pretrainedModel) {
      toast.error('请选择底模');
      return;
    }

    if (isCustom) {
      const validInputs = customInputs.filter((input) => input.trim() !== '');
      if (validInputs.length === 0) {
        toast.error('请至少输入一条有效的自定义输入');
        return;
      }
    }

    try {
      // 构建 lora_path 对象：每个 Lora 模型名称对应一个标签ID数组
      // 数组包含：前3个默认标签的ID + 该Lora模型对应的标签ID
      const loraPath: Record<string, string[]> = {};

      // 获取前3个默认标签的ID
      const defaultTagIds = defaultTags.length === 3 ? defaultTags.map((tag) => tag.id) : [];

      // 为每个选中的 Lora 模型构建标签ID数组
      for (const loraModelName of selectedLoraModels) {
        // 查找该 Lora 模型对应的标签
        const loraModelTag = loraModelTags.find((tag) => tag.name === loraModelName);

        if (loraModelTag) {
          // 前3个默认标签ID + 该Lora模型标签ID
          loraPath[loraModelName] = [...defaultTagIds, loraModelTag.id];
        } else {
          // 如果找不到对应的标签，只使用默认标签
          loraPath[loraModelName] = [...defaultTagIds];
        }
      }

      // 构建请求参数
      const requestData: any = {
        model_training_id: modelTrainingId,
        model_path: pretrainedModel,
        lora_path: loraPath,
      };

      // 如果是自定义测试，添加 test_txt 参数
      if (isCustom) {
        const validInputs = customInputs.filter((input) => input.trim() !== '');
        requestData.test_txt = validInputs;
      }

      // 调用后端API
      const response = await fetch('/api/model-training/start-model-test-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: false }),
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 200) {
        toast.success(isCustom ? '自定义测试已开始' : '默认测试已开始');
      } else {
        toast.error(result.message || '测试启动失败');
      }
    } catch (error) {
      console.error('启动测试失败:', error);
      toast.error('启动测试失败，请稍后重试');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <h2 className="text-2xl font-bold">模型测试</h2>

      <div className="flex flex-col gap-4">
        {/* 上方：模型配置和测试模式 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{testMode === 'download' ? '模型下载配置' : '模型测试配置'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 测试模式部分 - 移到最上面 */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{testMode === 'download' ? '下载模式' : '测试模式'}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={testMode}
                      onValueChange={(value) => setTestMode(value as 'default' | 'custom' | 'download')}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">默认测试</SelectItem>
                        <SelectItem value="custom">自定义测试</SelectItem>
                        <SelectItem value="download">模型下载</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 模型配置部分 */}
              {testMode === 'download' ? (
                /* 模型下载配置 */
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Lora 模型</label>
                    <Select
                      value={selectedDownloadModel}
                      onValueChange={setSelectedDownloadModel}
                      disabled={isLoadingDownloadableModel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingDownloadableModel ? '加载中...' : '选择 Lora 模型'} />
                      </SelectTrigger>
                      <SelectContent>
                        {downloadableModel && downloadableModel.length > 0 ? (
                          downloadableModel.map((model) => (
                            <SelectItem key={model.model_name} value={model.model_name}>
                              {model.model_name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {isLoadingDownloadableModel
                              ? '加载中...'
                              : downloadableModel && downloadableModel.length === 0
                                ? '模型正在上传中，请稍后再试'
                                : '暂无可用模型'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedDownloadModel && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const selectedModel = downloadableModel?.find(
                              (model) => model.model_name === selectedDownloadModel,
                            );
                            if (selectedModel?.model_url) {
                              window.open(selectedModel.model_url, '_blank');
                            }
                          }}
                          disabled={
                            !downloadableModel?.find((model) => model.model_name === selectedDownloadModel)?.model_url
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载模型
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 模型测试配置 */
                <div className="space-y-4">
                  {/* Lora 模型选择和底模选择放在一行 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Lora 模型选择（多选） */}
                    <div>
                      <label className="text-sm font-medium">Lora 模型（可多选）</label>
                      <Select
                        value={selectedLoraModels[0] || ''}
                        onValueChange={(value) => {
                          if (value && !selectedLoraModels.includes(value)) {
                            setSelectedLoraModels([...selectedLoraModels, value]);
                          }
                        }}
                        disabled={isLoadingLoraModels}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingLoraModels ? '加载中...' : '选择 Lora 模型'} />
                        </SelectTrigger>
                        <SelectContent>
                          {loraModels.length > 0 ? (
                            loraModels.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {isLoadingLoraModels ? '加载中...' : '暂无可用 Lora 模型'}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedLoraModels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedLoraModels.map((modelId) => (
                            <Badge key={modelId} variant="secondary" className="flex items-center gap-1">
                              {modelId}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  setSelectedLoraModels(selectedLoraModels.filter((id) => id !== modelId));
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底模选择 */}
                    <div>
                      <label className="text-sm font-medium">底模选择</label>
                      <Select
                        value={pretrainedModel}
                        onValueChange={setPretrainedModel}
                        disabled={isLoadingPretrainedModels}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingPretrainedModels ? '加载中...' : '选择底模'} />
                        </SelectTrigger>
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
                    </div>
                  </div>
                </div>
              )}

              {/* 自定义输入部分 */}
              <div className="space-y-4">
                {testMode === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">自定义输入（最多20条）</label>
                    <div className="grid grid-cols-2 gap-3">
                      {customInputs.map((input, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <Textarea
                            value={input}
                            onChange={(e) => handleCustomInputChange(index, e.target.value)}
                            placeholder={`输入第 ${index + 1} 条测试内容`}
                            className="min-h-[75px] w-full"
                            maxLength={500}
                          />
                          {customInputs.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="small"
                              onClick={() => handleRemoveCustomInput(index)}
                              className="w-full"
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {customInputs.length < 20 && (
                      <Button variant="outline" size="small" onClick={handleAddCustomInput}>
                        <Plus className="mr-2 h-4 w-4" />
                        添加输入
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 开始测试按钮 */}
          {testMode !== 'download' && (
            <div className="flex gap-2">
              <Button onClick={() => handleStartTest(false)} disabled={testMode === 'custom'} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                开始默认测试
              </Button>
              <Button onClick={() => handleStartTest(true)} disabled={testMode === 'default'} className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                开始自定义测试
              </Button>
            </div>
          )}
        </div>

        {/* 下方：标签筛选和文件显示（上下结构） */}
        <div className="flex flex-1 flex-col gap-4">
          {/* 标签筛选面板 */}
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
                      className="mb-3"
                    />

                    {/* 标签列表 */}
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {allTags
                        ?.filter((tag) => {
                          // 只显示默认标签和 Lora 模型标签
                          const isDefaultTag = defaultTags.some((dt) => dt.id === tag.id);
                          const isLoraModelTag = loraModelTags.some((lt) => lt.id === tag.id);
                          if (!isDefaultTag && !isLoraModelTag) {
                            return false;
                          }
                          // 搜索过滤
                          if (tagSearchValue) {
                            return tag.name.includes(tagSearchValue) || tag._pinyin?.includes(tagSearchValue);
                          }
                          return true;
                        })
                        .map((tag) => {
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
                        })}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="small"
                  icon={<RotateCcw />}
                  onClick={handleResetTags}
                  disabled={defaultTags.length !== 3}
                >
                  重置
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
              </div>
            </div>
          </div>

          {/* 文件列表 */}
          <div className="flex flex-1 flex-col gap-2">
            {/* 文件列表内容 */}
            <div className="flex-1 overflow-y-auto">
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
                  <p className="text-muted-foreground">暂无文件</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-8 gap-4">
                    {mediaFiles.map((file: IAssetItem<IMediaData>) => {
                      const isSelected = selectedFileIds.has(file.id);
                      return (
                        <div
                          key={file.id}
                          className={`group relative aspect-square overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                          onClick={(e) => {
                            // 只在选择模式下处理点击事件
                            if (isSelectionMode) {
                              e.stopPropagation();
                              const newSet = new Set(selectedFileIds);
                              if (newSet.has(file.id)) {
                                newSet.delete(file.id);
                              } else {
                                newSet.add(file.id);
                              }
                              setSelectedFileIds(newSet);
                            }
                          }}
                        >
                          {/* 选中复选框（仅在选择模式下显示） */}
                          {isSelectionMode && (
                            <div className="absolute left-2 top-2 z-10">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  const newSet = new Set(selectedFileIds);
                                  if (newSet.has(file.id)) {
                                    newSet.delete(file.id);
                                  } else {
                                    newSet.add(file.id);
                                  }
                                  setSelectedFileIds(newSet);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}

                          {/* 文件内容 */}
                          {file.type?.startsWith('image/') ? (
                            <Image
                              src={file.url}
                              alt={getI18nContent(file.displayName)}
                              className="h-full w-full object-cover"
                              preview={
                                isSelectionMode
                                  ? false
                                  : {
                                      src: file.url,
                                      icons,
                                      closeIcon,
                                      mask: <Eye className="stroke-white" />,
                                    }
                              }
                            />
                          ) : isTextFile(file) ? (
                            <AssetContentPreview asset={file} isThumbnail />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                              <div className="text-center">
                                <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                <div className="text-sm text-gray-500">非文本文件</div>
                              </div>
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
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
                  {/* 底部透明区域，让滚动条可以滑动下去 */}
                  <div className="h-20 flex-shrink-0" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
