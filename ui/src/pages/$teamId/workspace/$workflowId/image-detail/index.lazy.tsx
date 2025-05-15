import React, { useEffect, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { useEventEmitter, useMemoizedFn } from 'ahooks';
import {
  ChevronDown,
  ChevronUp,
  Download,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Trash,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution, getWorkflowExecution } from '@/apis/workflow/execution';
import ImageDetailLayout from '@/components/layout/image-detail-layout';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { useVinesFlow } from '@/package/vines-flow';

import 'rc-image/assets/index.css';

interface IImageDetailProps { }

// 深拷贝工具
function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

interface TabularRenderWrapperProps {
  height?: number;
  originalInputImages: string[];
}

// TabularRender包装组件，用于获取工作流输入参数
const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({ height, originalInputImages }) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [processedInputs, setProcessedInputs] = React.useState<any[]>([]);
  const [localOriginalImages, setLocalOriginalImages] = React.useState<string[]>(originalInputImages || []);

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 更新本地图片状态
  React.useEffect(() => {
    if (originalInputImages && originalInputImages.length > 0) {
      console.log('TabularRenderWrapper: 更新本地原始输入图片:', originalInputImages);
      setLocalOriginalImages(originalInputImages);
    }
  }, [originalInputImages]);

  // 从vines中获取工作流输入参数
  const inputs = vines.workflowInput;
  const workflowId = vines.workflowId;

  // 计算动态高度，确保表单能够适应窗口高度
  const dynamicHeight = height || Math.max(1000, windowHeight - 150);

  // 处理输入字段和原始图片
  React.useEffect(() => {
    if (!inputs || inputs.length === 0) {
      console.log('TabularRenderWrapper: 没有输入字段可用');
      setProcessedInputs([]);
      return;
    }

    // 深拷贝inputs
    const newInputs = deepClone(inputs);
    console.log('TabularRenderWrapper: 本地原始输入图片:', localOriginalImages);
    console.log('TabularRenderWrapper: 表单输入字段:', newInputs);

    // 查找表单中的图片字段，如果有图片字段但没有原始图片，尝试使用字段中的值
    if ((!localOriginalImages || localOriginalImages.length === 0) && newInputs.length > 0) {
      const imageFields = newInputs.filter((item: any) =>
        (item.type === 'image' || item.type === 'file') && item.data && typeof item.data === 'string'
      );

      if (imageFields.length > 0) {
        const extractedImages = imageFields.map((item: any) => item.data).filter(Boolean);
        if (extractedImages.length > 0) {
          console.log('TabularRenderWrapper: 从表单字段中提取图片URL:', extractedImages);
          setLocalOriginalImages(extractedImages);
          return; // 等待下一次渲染周期
        }
      }
    }

    if (localOriginalImages && localOriginalImages.length > 0) {
      console.log('TabularRenderWrapper: 使用本地原始输入图片替换表单数据');

      // 遍历所有输入字段
      newInputs.forEach((item: any) => {
        console.log(`检查字段 ${item.name}, 类型: ${item.type}`);

        // 处理图片和文件类型的字段
        if (item.type === 'image' || item.type === 'file') {
          console.log(`替换字段 ${item.name} 的值为 ${localOriginalImages[0]}`);

          // 设置字段值为原始输入图片URL
          item.data = localOriginalImages[0];

          // 确保typeOptions存在
          if (!item.typeOptions) {
            item.typeOptions = {};
          }

          // 添加原始输入图片属性
          item.typeOptions.originalFiles = localOriginalImages;

          // 设置默认值
          item.default = localOriginalImages[0];

          console.log(`字段 ${item.name} 替换后:`, item);
        }
      });
    } else {
      console.log('TabularRenderWrapper: 没有原始输入图片可用');
    }

    setProcessedInputs(newInputs);
  }, [inputs, localOriginalImages]);

  // 如果没有处理好的输入字段，显示加载状态
  if (processedInputs.length === 0 && inputs && inputs.length > 0) {
    return <div className="flex h-full w-full items-center justify-center">处理表单数据中...</div>;
  }

  // 确保传递给TabularRender的originalInputImages不为undefined
  const safeOriginalImages = localOriginalImages || [];

  return (
    <TabularRender
      inputs={processedInputs}
      height={dynamicHeight}
      event$={tabular$}
      workflowId={workflowId}
      scrollAreaClassName=""
      originalInputImages={safeOriginalImages}
    />
  );
};

export const ImageDetail: React.FC<IImageDetailProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { history } = router;
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageFlipY, setImageFlipY] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [originalInputImages, setOriginalInputImages] = useState<string[]>([]);

  // 从路由搜索参数中获取图片信息
  const searchParams = new URLSearchParams(window.location.search);
  const imageUrl = searchParams.get('imageUrl') || '';
  const instanceId = searchParams.get('instanceId') || '';

  // 调试信息
  console.log('图片详情页面 - 初始化参数:', {
    imageUrl,
    instanceId,
    search: window.location.search,
    pathname: window.location.pathname
  });

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/image-detail/' });

  // 获取原始输入图片
  useEffect(() => {
    // 如果URL参数中有imageUrl，直接使用它作为原始输入图片
    if (imageUrl) {
      console.log('使用URL参数中的图片URL作为原始输入图片:', imageUrl);
      setOriginalInputImages([imageUrl]);
    }

    // 无论是否有imageUrl，都尝试从instanceId获取更多信息
    async function fetchOriginalInputImages() {
      if (!instanceId) {
        console.log('没有instanceId，无法获取原始输入图片');
        return;
      }

      try {
        console.log('开始获取原始输入图片，instanceId:', instanceId);
        const res = await getWorkflowExecution(instanceId);
        if (!res) {
          console.log('未获取到执行结果数据');
          return;
        }

        console.log('获取到执行结果数据:', JSON.stringify(res, null, 2));

        const images: string[] = [];
        const data = res;

        // 检查URL的辅助函数
        const isLikelyImageUrl = (str: string): boolean => {
          if (typeof str !== 'string') return false;

          // 检查常见图片扩展名
          const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp)($|\?)/i.test(str);

          // 检查常见图片路径
          const hasImagePath = str.includes('/monkeys/workflow/') ||
            str.includes('/user-files/workflow-input/') ||
            str.includes('/monkeyminio01.daocloud.cn/');

          return hasImageExt || hasImagePath || str.includes('/monkeys/');
        };

        // 递归处理对象，查找所有可能的图片URL
        const extractImageUrls = (obj: any, path = ''): void => {
          if (!obj) return;

          // 如果是字符串且看起来像图片URL
          if (typeof obj === 'string' && isLikelyImageUrl(obj)) {
            console.log(`找到可能的图片URL (${path}):`, obj);
            images.push(obj);
            return;
          }

          // 如果是数组，递归处理每个元素
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              extractImageUrls(item, `${path}[${index}]`);
            });
            return;
          }

          // 如果是对象，递归处理每个属性
          if (typeof obj === 'object') {
            // 特殊处理图片对象
            if (obj.type === 'image' && obj.data) {
              console.log(`找到图片对象 (${path}):`, obj.data);
              images.push(obj.data);
              return;
            }

            // 递归处理对象的所有属性
            Object.entries(obj).forEach(([key, value]) => {
              extractImageUrls(value, path ? `${path}.${key}` : key);
            });
          }
        };

        // 检查是否有直接的图片URL
        if (typeof data === 'string' && isLikelyImageUrl(data)) {
          console.log('直接使用字符串URL:', data);
          images.push(data);
        }

        // 优先处理特定结构
        if (data.input) {
          // 优先处理 input-parameters 结构
          if (data.input.type === 'input-parameters' && Array.isArray(data.input.data)) {
            console.log('处理input-parameters结构');
            data.input.data.forEach((input: any) => {
              if (input.type === 'image' && input.data) {
                console.log(`找到图片输入: ${input.data}`);
                images.push(input.data);
              }
            });
          }

          // 处理__context.input结构
          if (data.input.__context && data.input.__context.input) {
            console.log('处理__context.input结构');
            extractImageUrls(data.input.__context.input, 'input.__context.input');
          }
        }

        // 全面扫描整个数据对象
        console.log('全面扫描数据对象查找图片URL');
        extractImageUrls(data, 'root');

        console.log('最终找到的原始输入图片:', images);

        if (images.length > 0) {
          // 去重
          const uniqueImages = [...new Set(images)];
          console.log('去重后的原始输入图片:', uniqueImages);

          // 过滤掉可能无效的URL
          const validImages = uniqueImages.filter(url => {
            // 确保URL格式正确
            const isValid = url.startsWith('http://') ||
              url.startsWith('https://') ||
              url.startsWith('/');

            if (!isValid) {
              console.warn('过滤掉无效URL:', url);
            }
            return isValid;
          });

          console.log('过滤后的有效图片URL:', validImages);

          if (validImages.length > 0) {
            setOriginalInputImages(validImages);
          } else if (uniqueImages.length > 0) {
            // 如果没有有效URL但有原始URL，尝试使用第一个
            console.warn('没有有效的URL格式，尝试使用第一个原始URL:', uniqueImages[0]);
            setOriginalInputImages([uniqueImages[0]]);
          }

          // 如果URL参数中没有imageUrl，使用第一张图片作为主图
          if (!imageUrl && validImages.length > 0) {
            console.log('设置主图URL:', validImages[0]);
            // 注意：这里不能直接修改URL参数，因为会导致页面刷新
            // 可以考虑使用状态变量来存储主图URL
          }
        } else {
          console.log('未找到原始输入图片，使用默认图片');
          // 如果需要，可以在这里设置默认图片
          // setOriginalInputImages(['默认图片URL']);
        }
      } catch (error) {
        console.error('获取原始输入图片失败:', error);
      }
    }

    fetchOriginalInputImages();
  }, [instanceId, imageUrl, searchParams]);

  // 监听图片状态变化，更新图片样式
  useEffect(() => {
    // 获取图片元素
    const imgElement = document.querySelector('.rc-image img') as HTMLElement;
    if (imgElement) {
      // 应用旋转、翻转和缩放效果
      imgElement.style.transform = `
        rotate(${imageRotation}deg)
        scaleX(${imageFlipX ? -1 : 1})
        scaleY(${imageFlipY ? -1 : 1})
        scale(${imageScale})
      `;
      imgElement.style.transition = 'transform 0.3s ease';
    }
  }, [imageRotation, imageFlipX, imageFlipY, imageScale]);

  // 上一张/下一张图片功能已禁用

  // 处理删除图片
  const handleDeleteImage = useMemoizedFn(() => {
    // 如果有instanceId，则调用API删除
    if (instanceId) {
      toast.promise(deleteWorkflowExecution(instanceId), {
        success: () => {
          // 删除成功后返回上一页
          history.back();
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    } else {
      // 如果没有instanceId，直接返回上一页
      history.back();
      toast.success(t('common.delete.success'));
    }
  });

  // 右侧边栏组件
  const RightSidebar = (
    <div className="ml-4 flex h-full w-14 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 py-6 shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" onClick={() => history.back()} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back', '返回')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUp />} variant="outline" size="small" disabled={true} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDown />} variant="outline" size="small" disabled={true} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一张')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mb-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<Trash />} variant="outline" size="small" onClick={handleDeleteImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.delete', '删除')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ImageDetailLayout rightSidebar={RightSidebar}>
        {/* 主内容区域 */}
        <main className="flex size-full flex-1 flex-col overflow-hidden rounded-xl border border-input bg-background pb-6 shadow-sm dark:bg-[#111113] md:flex-row">
          {/* 左侧图片展示区 */}
          <div className="flex h-full w-full flex-col items-center overflow-hidden rounded-bl-xl rounded-br-xl rounded-tl-xl bg-background dark:bg-[#111113] sm:w-full md:w-[70%]">
            {imageUrl ? (
              <>
                <div className="flex w-full flex-1 items-center justify-center overflow-auto p-4">
                  <Image
                    src={imageUrl}
                    alt="详情图片"
                    className="rounded-lg"
                    style={{
                      display: 'block',
                      margin: 'auto',
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 200px)',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      transform: `
                        rotate(${imageRotation}deg)
                        scaleX(${imageFlipX ? -1 : 1})
                        scaleY(${imageFlipY ? -1 : 1})
                        scale(${imageScale})
                      `,
                      transition: 'transform 0.3s ease',
                    }}
                    preview={false}
                  />
                </div>
                {/* 图片操作按钮 - 底部 */}
                <div className="flex w-full items-center justify-center gap-2 bg-background py-3 dark:bg-[#111113] sm:gap-1 md:gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipVertical />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用垂直翻转效果
                          setImageFlipY((prev) => !prev);
                          toast.success(t('components.ui.image-preview.flipY-success', '已垂直翻转'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipY', '垂直翻转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<FlipHorizontal />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用水平翻转效果
                          setImageFlipX((prev) => !prev);
                          toast.success(t('components.ui.image-preview.flipX-success', '已水平翻转'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.flipX', '水平翻转')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<RotateCcw />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用左旋转效果
                          setImageRotation((prev) => prev - 90);
                          toast.success(t('components.ui.image-preview.rotateLeft-success', '已向左旋转'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.rotateLeft', '向左旋转')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<RotateCw />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用右旋转效果
                          setImageRotation((prev) => prev + 90);
                          toast.success(t('components.ui.image-preview.rotateRight-success', '已向右旋转'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.rotateRight', '向右旋转')}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<ZoomIn />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用放大效果
                          setImageScale((prev) => prev + 0.1);
                          toast.success(t('components.ui.image-preview.zoomIn-success', '已放大'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.zoomIn', '放大')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<ZoomOut />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // 直接应用缩小效果
                          setImageScale((prev) => Math.max(0.1, prev - 0.1));
                          toast.success(t('components.ui.image-preview.zoomOut-success', '已缩小'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('components.ui.image-preview.zoomOut', '缩小')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<Download />}
                        variant="outline"
                        size="small"
                        onClick={() => {
                          if (imageUrl) {
                            try {
                              const link = document.createElement('a');
                              link.href = imageUrl;
                              link.setAttribute('download', '');
                              link.setAttribute('target', '_self');
                              link.click();
                            } catch (error) {
                              console.error('下载异常:', error);
                            }
                          }
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.utils.download.label', '下载')}</TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                {t('workspace.image-detail.no-image', '无图片数据')}
              </div>
            )}
          </div>

          {/* 中间区域，渲染表单 */}
          <div className="flex h-full flex-1 flex-col overflow-auto rounded-r-xl rounded-tr-xl bg-background px-6 pt-6 dark:bg-[#111113] md:border-l md:border-input">
            <div className="h-full flex-1">
              <TabularRenderWrapper height={window.innerHeight - 150} originalInputImages={originalInputImages} />
            </div>
          </div>
        </main>
      </ImageDetailLayout>
    </VinesFlowProvider>
  );
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/image-detail/')({
  component: ImageDetail,
});
