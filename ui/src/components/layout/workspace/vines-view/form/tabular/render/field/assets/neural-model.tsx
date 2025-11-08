import React, { useCallback, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IMediaData } from '@/apis/media-data/typings';
import { useUgcMediaData } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings';
import { FormControl, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_ASSET_ICON_URL } from '@/consts/icons.ts';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

interface IFieldNeuralModelProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
}

type NeuralModelAsset = IAssetItem<IMediaData>;

export const FieldNeuralModel: React.FC<IFieldNeuralModelProps> = ({ input: { typeOptions }, value, onChange }) => {
  const { t } = useTranslation();
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // 获取神经模型列表 - 使用与 nav/concept-design:design-models/neural-models 页面相同的方式
  // 参考：ui/src/pages/$teamId/neural-models/index.lazy.tsx
  // 通过 filterNeuralModel: 'only' 过滤，只获取 params.type === 'neural-model' 的媒体文件
  const {
    data: mediaData,
    isLoading,
    error,
  } = useUgcMediaData(
    {
      page: 1,
      limit: 100,
      search: typeOptions?.search || '',
    },
    'only', // 只获取神经模型，与神经模型页面使用相同的方式
  );

  // 注意：paginationWrapper 返回的数据结构是 { data, page, limit, total }
  // 而不是 { list, ... }，所以应该使用 mediaData?.data
  const neuralModels = (mediaData?.data ?? []) as NeuralModelAsset[];

  // 调试信息：检查数据加载情况
  React.useEffect(() => {
    if (!isLoading) {
      console.log('[FieldNeuralModel] 数据加载完成:', {
        total: mediaData?.total ?? 0,
        listLength: neuralModels.length,
        error,
        firstItem: neuralModels[0],
        mediaData,
      });
    }
  }, [isLoading, mediaData, neuralModels, error]);

  const { ref, width } = useElementSize();
  const enableMaxWidth = width > 200;

  // 当选择改变时，获取JSON内容
  const handleValueChange = useCallback(
    async (assetId: string) => {
      if (!assetId || assetId === ' ') {
        onChange(undefined);
        setSelectedAssetId(null);
        return;
      }

      setSelectedAssetId(assetId);
      setIsLoadingContent(true);

      try {
        // 找到选中的资产
        const selectedAsset = neuralModels.find((item) => item.id === assetId);
        if (!selectedAsset?.url) {
          throw new Error('Asset URL not found');
        }

        // 获取JSON内容
        const response = await fetch(selectedAsset.url);
        if (!response.ok) {
          throw new Error('Failed to fetch JSON content');
        }

        const jsonText = await response.text();

        // 验证是否为有效JSON
        let jsonContent: any;
        try {
          jsonContent = JSON.parse(jsonText);
        } catch {
          // 如果不是有效JSON，直接使用文本内容
          jsonContent = jsonText;
        }

        // 将JSON内容序列化为字符串存储到表单中（满足 schema 验证要求）
        // schema 只允许 string/number/boolean/array，不允许 object
        // 所以在表单中存储为字符串，提交时后端可以解析
        const jsonString = typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent);
        onChange(jsonString);
      } catch (error) {
        console.error('Failed to load neural model content:', error);
        toast.error(
          t('workspace.pre-view.actuator.execution-form.neural-model.load-error', {
            defaultValue: '加载神经模型内容失败',
          }),
        );
        // 获取失败时，清空选择
        setSelectedAssetId(null);
        onChange(undefined);
      } finally {
        setIsLoadingContent(false);
      }
    },
    [neuralModels, onChange, t],
  );

  // 当表单已有值时，尝试匹配对应的资产
  // 表单中存储的是 JSON 字符串，需要尝试匹配资产
  React.useEffect(() => {
    if (value && typeof value === 'string' && !selectedAssetId && neuralModels.length > 0) {
      // 尝试通过 URL 匹配：从 JSON 字符串中解析可能包含的信息，或者通过其他方式匹配
      // 这里暂时不自动匹配，让用户重新选择，因为 JSON 字符串可能不包含资产ID信息
      // 如果将来需要自动匹配，可以通过比较 JSON 内容的 hash 或其他方式
    }
  }, [value, selectedAssetId, neuralModels]);

  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = selectedAssetId || (hasValue ? '__has_value__' : undefined);

  return (
    <AnimatePresence mode="popLayout">
      {isLoading || isLoadingContent ? (
        <motion.div
          key="vines-neural-model-loading"
          className="flex h-[76px] w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading size="md" />
        </motion.div>
      ) : (
        <motion.div
          key="vines-neural-model"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <FormControl>
            <Select onValueChange={handleValueChange} value={displayValue} disabled={isLoadingContent}>
              <SelectTrigger ref={ref}>
                <SelectValue
                  placeholder={
                    hasValue && !selectedAssetId
                      ? t('workspace.pre-view.actuator.execution-form.neural-model.selected', {
                          defaultValue: '已选择神经模型（JSON内容）',
                        })
                      : t('workspace.pre-view.actuator.execution-form.neural-model.placeholder', {
                          defaultValue: '请选择神经模型',
                        })
                  }
                />
              </SelectTrigger>
              <SelectContent style={enableMaxWidth ? { maxWidth: width + 25 } : {}}>
                {hasValue && !selectedAssetId && (
                  <SelectItem value="__has_value__" disabled>
                    {t('workspace.pre-view.actuator.execution-form.neural-model.current-value', {
                      defaultValue: '当前值：JSON内容（请重新选择以更改）',
                    })}
                  </SelectItem>
                )}
                <SelectItem value=" ">
                  {t('workspace.pre-view.actuator.execution-form.neural-model.no-model', {
                    defaultValue: '不使用模型',
                  })}
                </SelectItem>
                {neuralModels.length === 0 && !isLoading ? (
                  <SelectItem value="__empty__" disabled>
                    {t('workspace.pre-view.actuator.execution-form.neural-model.empty', {
                      defaultValue: '暂无神经模型，请先在设计资产中创建',
                    })}
                  </SelectItem>
                ) : (
                  neuralModels.map((asset) => {
                    const displayName = getI18nContent(asset.displayName || asset.name);
                    const description = getI18nContent(asset.description);
                    const iconUrl = asset.iconUrl || DEFAULT_ASSET_ICON_URL;

                    return (
                      <Tooltip key={asset.id}>
                        <TooltipTrigger asChild>
                          <SelectItem value={asset.id}>
                            <div className="flex w-full items-center gap-2">
                              <VinesIcon src={iconUrl} size="xs" />
                              <div className="flex-1">
                                <p className="break-all text-sm font-bold leading-4">{displayName}</p>
                                {description && (
                                  <p className="line-clamp-1 break-all text-xs text-muted-foreground">{description}</p>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        </TooltipTrigger>
                        {description && <TooltipContent>{description}</TooltipContent>}
                      </Tooltip>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
