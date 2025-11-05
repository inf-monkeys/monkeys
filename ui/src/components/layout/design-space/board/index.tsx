import React, { ErrorInfo, startTransition, useCallback, useEffect } from 'react';

import './index.scss';

import { useEventEmitter } from 'ahooks';
import { get } from 'lodash';
import {
  AssetRecordType,
  createShapeId,
  defaultBindingUtils,
  DefaultContextMenu,
  DefaultContextMenuContent,
  defaultEditorAssetUrls,
  defaultShapeTools,
  defaultTools,
  Editor,
  FrameShapeUtil,
  TLAssetStore,
  TLComponents,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TLImageShape,
  TLShape,
  TLShapeId,
  TLUiContextMenuProps,
  useEditor,
  useToasts,
} from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { useInfiniteWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { useUniImagePreview } from '@/components/layout-wrapper/main/uni-image-preview';
import { uploadSingleFile } from '@/components/ui/vines-uploader/standalone';
import type { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';
import { newConvertExecutionResultToItemList } from '@/utils/execution';
import { getImageSize } from '@/utils/file';

import { ExternalLayerPanel } from './ExternalLayerPanel';
// Agent 嵌入由 ExternalLayerPanel 控制
import { MiniToolsToolbar } from './mini-tools-toolbar.tsx';
import { createPlaceholderShape, updateShapeWithResult } from './placeholder-utils';
import {
  ConnectionManager,
  InstructionShapeUtil,
  InstructionTool,
  OutputShapeUtil,
  OutputTool,
  WorkflowShapeUtil,
  WorkflowTool,
} from './shapes';
import { VerticalToolbar } from './vertical-toolbar.tsx';

import 'tldraw/tldraw.css';
import './layer-panel.css';

class FixedFrameShapeUtil extends FrameShapeUtil {
  // override canResize() {
  //   return true;
  // }

  // 重写getGeometry方法以防止文本测量错误
  getGeometry(shape: any) {
    try {
      return super.getGeometry(shape);
    } catch (error) {
      console.warn('FrameShapeUtil geometry calculation error:', error);
      // 返回默认几何形状，使用super.getGeometry的默认实现
      try {
        return super.getGeometry({ ...shape, props: { ...shape.props, w: 100, h: 100 } });
      } catch (fallbackError) {
        console.warn('Fallback geometry calculation also failed:', fallbackError);
        // 如果还是失败，返回一个简单的矩形几何
        return {
          x: 0,
          y: 0,
          w: 100,
          h: 100,
          isFilled: false,
          isClosed: true,
          isLabel: false,
          isInternal: false,
        } as any;
      }
    }
  }
}

// 错误边界组件
class TldrawErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tldraw Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '16px',
            color: '#666',
          }}
        >
          <div>画板加载出现问题</div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4D8F9D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type BoardInstance = {
  frameShapeId: TLShapeId;
};

interface BoardProps {
  editor: Editor | null;
  setEditor: (editor: Editor) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  instance?: BoardInstance;
  persistenceKey?: string;
}

// 创建自定义右键菜单组件
function CustomContextMenu(props: TLUiContextMenuProps & { miniPage?: any }) {
  const editor = useEditor();
  const { addToast } = useToasts();
  const { openPreview } = useUniImagePreview();
  const { miniPage } = props;

  const handleViewDetails = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length != 1 || selectedShapes[0].type !== 'image') {
      addToast({
        title: 'Please select only one image',
        severity: 'error',
      });
      return;
    }

    const imageShape = selectedShapes[0] as TLImageShape;
    const assetId = imageShape.props.assetId;

    if (!assetId) {
      addToast({
        title: 'Image asset not found',
        severity: 'error',
      });
      return;
    }

    const asset = editor.getAsset(assetId);

    if (asset?.type != 'image' || !asset.props.src) {
      addToast({
        title: 'Image asset not found',
        severity: 'error',
      });
      return;
    }

    const imageUrl = asset.props.src;
    openPreview(imageUrl);
  };

  // 检测当前应用是否有图片输入字段
  const getImageInputFields = () => {
    if (!miniPage) return [];

    // 尝试不同的路径来获取输入字段
    const inputs =
      miniPage?.workflow?.variables || // 主要路径：workflow.variables
      miniPage?.workflow?.input ||
      miniPage?.workflow?.data?.input ||
      miniPage?.workflow?.definition?.input ||
      miniPage?.agent?.workflow?.variables ||
      miniPage?.agent?.workflow?.input ||
      miniPage?.agent?.workflow?.data?.input ||
      miniPage?.agent?.data?.workflow?.input ||
      [];

    return inputs.filter((input: any) => input.type === 'file');
  };

  // 获取当前选中的图片URL
  const getSelectedImageUrl = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length !== 1 || selectedShapes[0].type !== 'image') {
      return null;
    }

    const imageShape = selectedShapes[0] as TLImageShape;
    const assetId = imageShape.props.assetId;
    if (!assetId) return null;

    const asset = editor.getAsset(assetId);
    if (asset?.type !== 'image' || !asset.props.src) return null;

    return asset.props.src;
  };

  // 处理添加图片到应用
  const handleAddToApp = (fieldName: string, appDisplayName: string) => {
    const imageUrl = getSelectedImageUrl();
    if (!imageUrl) {
      addToast({
        title: '请选择一张图片',
        severity: 'error',
      });
      return;
    }

    // 通过自定义事件通知应用更新图片字段
    window.dispatchEvent(
      new CustomEvent('vines:add-image-to-field', {
        detail: {
          pageId: miniPage.id,
          fieldName,
          imageUrl,
          appDisplayName,
        },
      }),
    );

    addToast({
      title: `图片已添加到 ${appDisplayName} - ${fieldName}`,
      severity: 'success',
    });
  };

  const imageInputFields = getImageInputFields();
  const selectedImageUrl = getSelectedImageUrl();
  const hasSelectedImage = !!selectedImageUrl;

  return (
    <DefaultContextMenu {...props}>
      <TldrawUiMenuGroup id="custom-actions">
        <TldrawUiMenuItem id="view-details" label="显示图片详情" icon="info" readonlyOk onSelect={handleViewDetails} />
        {/* 当有应用打开且有图片输入字段时，显示添加到应用的选项 */}
        {hasSelectedImage &&
          imageInputFields.length > 0 &&
          imageInputFields.map((field: any) => {
            // 处理应用名称（可能是对象）
            const rawAppName = miniPage?.workflow?.displayName || miniPage?.agent?.displayName || '应用';
            const appName =
              typeof rawAppName === 'string'
                ? rawAppName
                : rawAppName?.['zh-CN'] || rawAppName?.['zh'] || rawAppName?.['en'] || '应用';

            // 处理字段显示名称（可能是对象）
            const fieldDisplayName =
              typeof field.displayName === 'string'
                ? field.displayName
                : field.displayName?.['zh-CN'] || field.displayName?.['zh'] || field.displayName?.['en'] || field.name;

            return (
              <TldrawUiMenuItem
                key={`add-to-${field.name}`}
                id={`add-to-${field.name}`}
                label={`添加到 ${appName} - ${fieldDisplayName}（图片输入）`}
                icon="plus"
                readonlyOk
                onSelect={() => handleAddToApp(field.name, appName)}
              />
            );
          })}
      </TldrawUiMenuGroup>
      <DefaultContextMenuContent />
    </DefaultContextMenu>
  );
}

const assetsStore: TLAssetStore = {
  async upload(asset, file) {
    try {
      // 调试信息：查看 tldraw 传入的文件信息
      console.log('[assetsStore.upload] 收到文件:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        asset,
      });

      // 检查文件名是否有扩展名，如果没有则根据 MIME 类型添加
      let fileToUpload = file;
      const fileName = file.name;
      const hasExtension = fileName.includes('.') && !fileName.startsWith('.');

      if (!hasExtension && file.type) {
        // 根据 MIME 类型推断扩展名
        const mimeToExt: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp',
          'image/svg+xml': 'svg',
          'video/mp4': 'mp4',
          'video/webm': 'webm',
          'video/ogg': 'ogg',
        };

        const extension = mimeToExt[file.type];
        if (extension) {
          // 创建新的 File 对象，带有正确的扩展名
          fileToUpload = new File([file], `${fileName}.${extension}`, {
            type: file.type,
            lastModified: file.lastModified,
          });
        }
      }

      // 使用 vines-uploader 进行文件上传
      const result = await uploadSingleFile(fileToUpload, {
        basePath: 'user-files/designs',
        maxSize: 50, // 50MB 限制
        autoUpload: true,
      });

      // 返回上传后的 URL
      const uploadUrl = result.urls[0];
      if (!uploadUrl) {
        throw new Error('上传失败：未获取到文件 URL');
      }

      return { src: uploadUrl };
    } catch (error) {
      console.error('Asset upload failed:', error);
      throw error;
    }
  },
  resolve(asset) {
    return asset.props.src;
  },
};

export const Board: React.FC<BoardProps> = ({
  editor,
  setEditor,
  canvasWidth,
  canvasHeight,
  instance,
  persistenceKey,
}) => {
  const frameShapeId = instance?.frameShapeId || createShapeId();
  const { data: oem } = useSystemConfig();

  const { setBoardCanvasSize, width, height } = useBoardCanvasSizeStore();
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [miniPage, setMiniPage] = React.useState<any | null>(null);
  const [leftSidebarWidth, setLeftSidebarWidth] = React.useState<number>(300);
  const [resizing, setResizing] = React.useState<boolean>(false);
  const miniEvent$ = useEventEmitter<any>();
  const insertedUrlSetRef = React.useRef<Set<string>>(new Set());
  const miniStartTimeRef = React.useRef<number>(0);
  const miniBaselineIdsRef = React.useRef<Set<string>>(new Set());
  const miniBaselineReadyRef = React.useRef<boolean>(false);
  const miniBaselineUrlsRef = React.useRef<Set<string>>(new Set());
  // 跟踪鼠标位置，用于图片插入
  const mousePositionRef = React.useRef<{ x: number; y: number } | null>(null);
  // 存储instanceId到占位图shapeId的映射
  const placeholderMapRef = React.useRef<Map<string, string>>(new Map());
  // 追踪最后修改的shapeId
  const lastModifiedShapeIdRef = React.useRef<string | null>(null);

  // 获取当前模式
  const oneOnOne = get(oem, 'theme.designProjects.oneOnOne', false);
  // 是否展示左侧 页面+图层 sidebar（默认 false）
  const showPageAndLayerSidebar = get(oem, 'theme.designProjects.showPageAndLayerSidebar', false);
  // 是否自动创建默认画板（默认 true）
  const createDefaultFrame = get(oem, 'theme.designProjects.createDefaultFrame', true);

  const createFrame = useCallback(
    (editor: Editor, width: number, height: number) => {
      // 检查画板是否已经存在，避免重复创建
      const existingFrame = editor.getShape(frameShapeId as any);
      if (existingFrame) {
        return;
      }

      const defaultName = showPageAndLayerSidebar ? '默认画板' : 'Design Board';
      editor.createShape({
        type: 'frame',
        id: frameShapeId,
        x: 0,
        y: 0,
        props: {
          w: width,
          h: height,
          color: 'white',
          name: defaultName,
        },
      });

      // 设置视图以适应画板
      editor.zoomToFit();
    },
    [showPageAndLayerSidebar, frameShapeId],
  );

  // 监听选中画板变化（多画板模式）
  useEffect(() => {
    if (!editor || oneOnOne === true) return;

    const handleSelectionChange = () => {
      const selectedShapes = editor.getSelectedShapes();
      const frameShape = selectedShapes.find((shape) => shape.type === 'frame');

      if (frameShape && 'w' in frameShape.props && 'h' in frameShape.props) {
        const frameWidth = frameShape.props.w as number;
        const frameHeight = frameShape.props.h as number;

        // 更新显示的宽高
        startTransition(() => {
          setBoardCanvasSize(frameWidth, frameHeight);
        });
      }
    };

    // 监听选择变化
    editor.addListener('change', handleSelectionChange);

    // 初始检查
    handleSelectionChange();

    return () => {
      editor.removeListener('change', handleSelectionChange);
    };
  }, [editor, oneOnOne, setBoardCanvasSize]);

  // 单画板模式：更新固定画板尺寸
  useEffect(() => {
    if (width && height && editor && oneOnOne === true) {
      editor.updateShape({
        id: frameShapeId,
        type: 'frame',
        props: {
          w: width,
          h: height,
        },
      });
    }
  }, [width, height, editor, oneOnOne, frameShapeId]);

  // 定义自定义组件配置 - 使用useMemo稳定引用
  const components: TLComponents = React.useMemo(() => {
    const comps: TLComponents = {};

    // 根据 OEM 配置控制组件显示（未配置时隐藏）
    if (!get(oem, 'theme.designProjects.showPageMenu', false)) {
      comps.PageMenu = () => null;
    }

    if (!get(oem, 'theme.designProjects.showMainMenu', false)) {
      comps.MainMenu = () => null;
    }

    if (!get(oem, 'theme.designProjects.showStylePanel', false)) {
      comps.StylePanel = () => null;
    }

    // 控制 tldraw 左上角原生操作条（撤销/重做/删除/重复/更多）
    if (!get(oem, 'theme.designProjects.showActionsMenu', false)) {
      comps.ActionsMenu = () => null;
      comps.QuickActions = () => null;
    }

    // 使用自定义的竖向工具栏
    if (!get(oem, 'theme.designProjects.showToolbar', false)) {
      comps.Toolbar = () => null;
    } else {
      comps.Toolbar = VerticalToolbar;
    }

    const showContextMenu = get(oem, 'theme.designProjects.showContextMenu', true);

    if (showContextMenu) {
      comps.ContextMenu = (props: TLUiContextMenuProps) => <CustomContextMenu {...props} miniPage={miniPage} />;
    }

    return comps;
  }, [oem, miniPage, createDefaultFrame]); // 当oem或miniPage发生变化时重新创建

  // 创建 frame 函数引用 createDefaultFrame
  const createFrameWithConfig = useCallback(
    (editor: Editor, width: number, height: number) => {
      if (!createDefaultFrame) return;

      // 在多画板模式下，检查是否应该创建默认画板
      if (!oneOnOne) {
        // 检查是否已经有任何画板存在
        const allShapes = editor.getCurrentPageShapes();
        const hasAnyFrame = allShapes.some((shape) => shape.type === 'frame');

        // 如果已经有画板，说明用户已经在使用，不需要创建默认画板
        if (hasAnyFrame) return;

        // 如果没有任何画板，检查存储中是否有内容
        // 如果有内容但没有画板，说明用户可能删除了所有画板，尊重用户的选择
        try {
          const allShapesCount = allShapes.length;
          // 如果页面中有其他形状但没有画板，说明用户是有意删除画板的
          if (allShapesCount > 0) return;
        } catch (error) {
          // 忽略错误
        }
      }

      createFrame(editor, width, height);
    },
    [createFrame, createDefaultFrame, oneOnOne],
  );

  // 监听左侧面板折叠事件以调整外层容器高度
  React.useEffect(() => {
    const handler = (e: any) => {
      const collapsed = Boolean(e?.detail?.collapsed);
      setLeftCollapsed(collapsed);
      // 如果只是折叠而未打开 mini 应用，则不显示 iframe 容器
      if (collapsed) setMiniPage(null);
    };
    window.addEventListener('vines:toggle-left-sidebar-body', handler as any);
    return () => window.removeEventListener('vines:toggle-left-sidebar-body', handler as any);
  }, []);

  // 监听并限制侧栏宽度变化（200-400px）
  const onStartResize = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
  }, []);

  React.useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      const container = (document.querySelector('.layer-panel') as HTMLElement) || null;
      if (!container) return;
      const left = container.getBoundingClientRect().left;
      const next = Math.max(200, Math.min(400, e.clientX - left));
      setLeftSidebarWidth(next);
      // 通知其他组件（如工具栏）更新定位
      window.dispatchEvent(new CustomEvent('vines:left-sidebar-width-change', { detail: { width: next } }));
    };
    const handleUp = () => setResizing(false);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp, { once: true });
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp as any);
    };
  }, [resizing]);

  // 广播初始宽度，保证工具栏初次定位
  React.useEffect(() => {
    // 初始化时广播一次，确保 toolbar 不被遮挡
    window.dispatchEvent(new CustomEvent('vines:left-sidebar-width-change', { detail: { width: leftSidebarWidth } }));
  }, [leftSidebarWidth]);

  // Agent 嵌入由 ExternalLayerPanel 控制

  // 监听鼠标移动，记录鼠标位置
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 监听打开 mini 模式应用事件，记录当前 page 信息
  React.useEffect(() => {
    const handler = (e: any) => {
      const page = e?.detail?.page;
      if (page) setMiniPage(page);
    };
    window.addEventListener('vines:open-pinned-page-mini', handler as any);
    return () => window.removeEventListener('vines:open-pinned-page-mini', handler as any);
  }, []);

  // 监听shape变化，追踪最后修改的shape
  React.useEffect(() => {
    if (!editor) return;

    const unsubscribe = editor.store.listen((entry) => {
      // 检查是否有shape被更新
      if (entry.changes?.updated) {
        const updatedShapes = Object.keys(entry.changes.updated);
        // 过滤出真正的shape（排除其他类型的记录、画板等，但保留占位图）
        const shapeIds = updatedShapes.filter((id) => {
          try {
            const record = editor.store.get(id as any);
            if (!record || (record as any).typeName !== 'shape') return false;

            const shape = record as any;
            // 排除画板（frame类型）
            if (shape.type === 'frame') return false;

            return true;
          } catch {
            return false;
          }
        });

        if (shapeIds.length > 0) {
          // 记录最后一个被修改的shape
          const lastShapeId = shapeIds[shapeIds.length - 1];
          lastModifiedShapeIdRef.current = lastShapeId;

          // 输出调试信息
          try {
            const shape = editor.getShape(lastShapeId as any);
            console.log('[形状追踪] 检测到形状更新:', {
              shapeId: lastShapeId,
              shapeType: shape?.type,
              x: (shape as any)?.x,
              y: (shape as any)?.y,
              bounds: shape ? editor.getShapeGeometry(shape).bounds : null,
            });
          } catch (error) {
            console.warn('[形状追踪] 无法获取形状详情:', error);
          }
        }
      }

      // 检查是否有新创建的shape
      if (entry.changes?.added) {
        const addedShapes = Object.keys(entry.changes.added);
        const shapeIds = addedShapes.filter((id) => {
          try {
            const record = editor.store.get(id as any);
            if (!record || (record as any).typeName !== 'shape') return false;

            const shape = record as any;
            // 排除画板
            if (shape.type === 'frame') return false;

            return true;
          } catch {
            return false;
          }
        });

        if (shapeIds.length > 0) {
          const lastShapeId = shapeIds[shapeIds.length - 1];
          lastModifiedShapeIdRef.current = lastShapeId;

          // 输出调试信息
          try {
            const shape = editor.getShape(lastShapeId as any);
            console.log('[形状追踪] 检测到新形状创建:', {
              shapeId: lastShapeId,
              shapeType: shape?.type,
              x: (shape as any)?.x,
              y: (shape as any)?.y,
              bounds: shape ? editor.getShapeGeometry(shape).bounds : null,
            });
          } catch (error) {
            console.warn('[形状追踪] 无法获取形状详情:', error);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);

  // 监听创建占位图事件
  React.useEffect(() => {
    const handler = async (e: any) => {
      if (!editor) return;
      const { instanceId, workflowId, appName, appIcon } = e.detail || {};
      if (!instanceId || !workflowId) return;

      try {
        console.log('[占位图创建] 开始创建占位图', { instanceId, workflowId, appName });
        const shapeId = await createPlaceholderShape(
          editor,
          {
            instanceId,
            workflowId,
            appName: appName || 'AI应用',
            appIcon,
          },
          lastModifiedShapeIdRef.current,
        );

        // 保存映射关系
        placeholderMapRef.current.set(instanceId, shapeId);
        console.log('[占位图创建] 占位图创建成功，保存映射', { instanceId, shapeId });
      } catch (error) {
        console.error('创建占位图失败:', error);
      }
    };
    window.addEventListener('vines:create-placeholder', handler as any);
    return () => window.removeEventListener('vines:create-placeholder', handler as any);
  }, [editor]);

  // 记录 mini 打开时间，用于只接收新生成的输出
  React.useEffect(() => {
    if (miniPage) {
      miniStartTimeRef.current = Date.now();
      miniBaselineIdsRef.current.clear();
      miniBaselineUrlsRef.current.clear();
      miniBaselineReadyRef.current = false;
    } else {
      miniStartTimeRef.current = 0;
      insertedUrlSetRef.current.clear();
      miniBaselineIdsRef.current.clear();
      miniBaselineUrlsRef.current.clear();
      miniBaselineReadyRef.current = false;
    }
  }, [miniPage]);

  // 拉取执行输出并将图片直接插入画板
  const { data: allOutputsPages } = useInfiniteWorkflowExecutionAllOutputs({ limit: 20 });
  const historyOpenRef = React.useRef(false);
  React.useEffect(() => {
    const onToggle = (e: any) => {
      historyOpenRef.current = Boolean(e?.detail?.open);
    };
    window.addEventListener('vines:mini-history-toggle', onToggle as any);
    return () => window.removeEventListener('vines:mini-history-toggle', onToggle as any);
  }, []);
  React.useEffect(() => {
    if (!editor || !miniPage) return;
    if (historyOpenRef.current) return; // 历史面板打开时，不向画板插图
    const flat = (allOutputsPages?.flat() ?? []) as VinesWorkflowExecutionOutputListItem[];
    if (!flat?.length) return;
    const items = newConvertExecutionResultToItemList(flat);
    const workflowId = miniPage?.workflowId || (miniPage as any)?.workflow?.id;
    const startMs = miniStartTimeRef.current || 0;
    // 初始化基线：首次看到的当前列表全部加入基线并跳过本轮插入
    if (!miniBaselineReadyRef.current) {
      const baseline = new Set<string>();
      const baselineUrls = new Set<string>();
      for (let i = 0; i < items.length; i++) {
        const raw = flat[i] as any;
        const conv = (items as any[])[i];
        const isSameWorkflow =
          conv?.workflowId === workflowId || raw?.workflowId === workflowId || raw?.workflow?.id === workflowId;
        if (!isSameWorkflow) continue;
        const id = raw?.id || conv?.id;
        if (id) baseline.add(String(id));
        const url = conv?.render?.type?.toLowerCase?.() === 'image' ? (conv?.render?.data as string) : undefined;
        if (url) baselineUrls.add(url);
      }
      miniBaselineIdsRef.current = baseline;
      miniBaselineUrlsRef.current = baselineUrls;
      miniBaselineReadyRef.current = true;
      return;
    }
    (async () => {
      for (let i = 0; i < items.length; i++) {
        const conv = (items as any[])[i];
        const raw = flat[i] as any;
        if (!conv) continue;
        const isSameWorkflow =
          conv?.workflowId === workflowId || raw?.workflowId === workflowId || raw?.workflow?.id === workflowId;
        if (!isSameWorkflow) continue;
        const rawId = raw?.id || conv?.id;
        if (rawId && miniBaselineIdsRef.current.has(String(rawId))) continue;
        const createdAtStr = raw?.createdAt || raw?.updatedAt || raw?.time || raw?.timestamp;
        const createdMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
        if (startMs && createdMs && createdMs < startMs) continue;

        const resultType = String(conv?.render?.type).toLowerCase();
        const resultData = conv?.render?.data;

        // 检查是否有对应的占位图需要更新
        // 优先使用 instanceId（标准字段名）
        const instanceId = raw?.instanceId || conv?.instanceId || raw?.workflowInstanceId || raw?.executionId;
        let placeholderShapeId: string | undefined;
        if (instanceId) {
          placeholderShapeId = placeholderMapRef.current.get(instanceId);

          // 调试日志
          if (placeholderShapeId) {
            console.log('[占位图更新检查]', {
              instanceId,
              placeholderShapeId,
              resultType,
              resultData: typeof resultData === 'string' ? resultData.substring(0, 100) : resultData,
              rawId,
            });
          }
        }

        if (placeholderShapeId) {
          // 有占位图，检查结果是否有效
          const isValidResult = (() => {
            if (!resultData) return false;

            // 检查是否是空对象（中间态）
            if (typeof resultData === 'object' && Object.keys(resultData).length === 0) {
              return false;
            }

            // 对于图片类型，必须有有效的URL
            if (resultType === 'image') {
              return typeof resultData === 'string' && resultData.length > 0 && resultData.startsWith('http');
            }

            // 对于文本类型，必须有实际内容
            if (resultType === 'text' || resultType === 'string') {
              const textContent = typeof resultData === 'string' ? resultData : JSON.stringify(resultData);
              return textContent.length > 0;
            }

            // 对于视频类型，必须有有效的URL
            if (resultType === 'video') {
              return typeof resultData === 'string' && resultData.length > 0 && resultData.startsWith('http');
            }

            // 其他类型，只要有数据就认为有效
            return true;
          })();

          if (isValidResult) {
            // 有有效结果，更新占位图
            console.log('[占位图更新] 开始更新占位图，结果有效');
            try {
              await updateShapeWithResult(editor, placeholderShapeId, resultType, resultData);
              console.log('[占位图更新] 占位图更新成功');
              // 更新后移除映射
              placeholderMapRef.current.delete(instanceId);
              try {
                const workflowIdCompleted = miniPage?.workflowId || (miniPage as any)?.workflow?.id || null;
                // 将用于历史展示的 render.data 一并带上，便于右侧/左侧历史立即替换等待项
                window.dispatchEvent(
                  new CustomEvent('vines:mini-execution-completed', {
                    detail: {
                      instanceId,
                      workflowId: workflowIdCompleted,
                      status: 'COMPLETED',
                      render: { data: resultData },
                      endTime: Date.now(),
                    },
                  }),
                );
              } catch {}
              if (rawId) miniBaselineIdsRef.current.add(String(rawId));
              // 标记已处理
              if (resultType === 'image' && typeof resultData === 'string') {
                insertedUrlSetRef.current.add(resultData);
              }
            } catch (error) {
              console.error('更新占位图失败:', error);
            }
          } else {
            console.log('[占位图更新] 结果无效，保持占位图', {
              resultType,
              hasData: !!resultData,
              dataType: typeof resultData,
              isEmpty: typeof resultData === 'object' ? Object.keys(resultData).length === 0 : false,
            });
          }
          // 如果结果无效（如空对象{}），不更新占位图，保持占位图显示，继续等待有效结果
        }
        // 没有占位图时不再自动插入，只有通过点击生成按钮创建的占位图才会被更新
      }
    })();
  }, [allOutputsPages, editor, miniPage]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', flex: 1 }}>
      {/* Layer Panel - 固定在左侧（可配置） */}
      {showPageAndLayerSidebar && (
        <div
          className="layer-panel"
          style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            // 折叠时仅保留顶栏高度，去掉 bottom 以避免强制撑满
            height: leftCollapsed ? '48px' : 'calc(100% - 20px)',
            width: `${leftSidebarWidth}px`,
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: leftCollapsed ? 'hidden' : 'visible',
            ...(leftCollapsed ? {} : {}),
          }}
        >
          {editor && <ExternalLayerPanel editor={editor} />}
          {/* 右侧拖拽调宽手柄 */}
          {!leftCollapsed && (
            <div
              onMouseDown={onStartResize}
              style={{
                position: 'absolute',
                top: 0,
                right: -6,
                width: 12,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1001,
                // 命中区域更宽，视觉细线
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 6,
                  width: 1,
                  height: '100%',
                  background: '#e5e7eb',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* mini iframe 现已整合进 ExternalLayerPanel 内部渲染 */}

      {/* tldraw容器 - 全屏显示 */}
      <div
        style={{ height: '100%' }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();

          // 获取拖拽的图片URL
          const imageUrl = e.dataTransfer.getData('text/plain');
          if (!imageUrl || !editor) return;

          // 获取鼠标位置并转换为画布坐标
          const dropPoint = editor.screenToPage({ x: e.clientX, y: e.clientY });

          try {
            const { width, height } = await getImageSize(imageUrl);
            const id = AssetRecordType.createId();

            editor.createAssets([
              {
                id,
                type: 'image',
                typeName: 'asset',
                props: {
                  name: id,
                  src: imageUrl,
                  mimeType: 'image/png',
                  isAnimated: false,
                  h: height,
                  w: width,
                },
                meta: {},
              },
            ]);

            // 将图片放在鼠标位置
            editor.createShape({
              type: 'image',
              x: dropPoint.x - width / 2,
              y: dropPoint.y - height / 2,
              props: { assetId: id, w: width, h: height },
            });
          } catch (error) {
            console.error('Failed to insert image:', error);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
      >
        <TldrawErrorBoundary>
          <Tldraw
            persistenceKey={persistenceKey}
            onMount={(editor: Editor) => {
              setEditor(editor);
              // 只在单画板模式下保护默认画板不被删除
              if (oneOnOne) {
                editor.sideEffects.registerBeforeDeleteHandler('shape', (shape: TLShape) => {
                  if (shape.id === frameShapeId) {
                    return false;
                  }
                });
              }

              editor.sideEffects.registerBeforeChangeHandler('shape', (prevShape: TLShape, nextShape: TLShape) => {
                if (prevShape.id === frameShapeId) {
                  if (nextShape.type === 'frame' && 'w' in nextShape.props && 'h' in nextShape.props) {
                    startTransition(() => {
                      // @ts-ignore
                      setBoardCanvasSize(nextShape.props.w as number, nextShape.props.h as number);
                    });
                  }
                  return nextShape;
                }
                // 若是新创建或默认名仍为英文 Frame 的画板，自动改成中文“画板”
                try {
                  if (nextShape.type === 'frame') {
                    const name = (nextShape as any)?.props?.name;
                    if (!name || String(name).toLowerCase() === 'frame') {
                      return {
                        ...nextShape,
                        props: { ...(nextShape as any).props, name: '画板' },
                      } as TLShape;
                    }
                  }
                } catch {}
                return nextShape;
              });

              // 如果提供了画布尺寸且启用自动创建，则创建有界 frame
              if (canvasWidth && canvasHeight) {
                createFrameWithConfig(editor, canvasWidth, canvasHeight);
              }

              // 将默认英文页面名（如 Page 1 / Page1）改为中文“页面1”
              const renameDefaultPages = () => {
                try {
                  const pages = (editor as any).getPages?.() || [];
                  pages.forEach((p: any, idx: number) => {
                    const name: string = String(p?.name || '');
                    const m = name.match(/^Page\s*(\d+)$/i) || name.match(/^Page(\d+)$/i);
                    if (m && m[1]) {
                      const num = Number(m[1]);
                      const cn = `页面 ${Number.isFinite(num) ? num : idx + 1}`;
                      try {
                        (editor as any).renamePage?.(p.id, cn);
                      } catch {}
                    }
                  });
                } catch {}
              };
              // 立即执行一次，并在下一个宏任务再执行一次，避免初次渲染时覆盖
              renameDefaultPages();
              setTimeout(renameDefaultPages, 0);

              // 初始化 ConnectionManager 来监听 Instruction 和 Output 的连接
              try {
                const connectionManager = new ConnectionManager(editor);
                connectionManager.watchArrowConnections();
                console.log('[Board] ConnectionManager 已初始化');
              } catch (error) {
                console.error('[Board] ConnectionManager 初始化失败:', error);
              }

              editor.registerExternalContentHandler('url', async ({ url, point }) => {
                // 检查是否是图片 URL
                try {
                  // 获取图片数据

                  // 创建 asset
                  const imageUrl = url;
                  const { width, height } = await getImageSize(imageUrl);
                  const assetData = {
                    id: AssetRecordType.createId(),
                    url: imageUrl,
                    width: width,
                    height: height,
                  };

                  editor.createAssets([
                    {
                      id: assetData.id,
                      type: 'image',
                      typeName: 'asset',
                      props: {
                        name: assetData.id,
                        src: assetData.url,
                        mimeType: 'image/png',
                        isAnimated: false,
                        h: assetData.height,
                        w: assetData.width,
                      },
                      meta: {},
                    },
                  ]);

                  editor.createShape({
                    type: 'image',
                    x: point ? point.x - width / 2 : 0,
                    y: point ? point.y - height / 2 : 0,
                    props: {
                      assetId: assetData.id,
                      w: assetData.width,
                      h: assetData.height,
                    },
                  });

                  return true; // 表示已处理
                } catch (e) {
                  console.error(e);
                }

                return false; // 未处理,使用默认行为
              });
            }}
            components={components}
            shapeUtils={[FixedFrameShapeUtil, InstructionShapeUtil, OutputShapeUtil, WorkflowShapeUtil]}
            bindingUtils={defaultBindingUtils}
            tools={[...defaultShapeTools, ...defaultTools, InstructionTool, OutputTool, WorkflowTool]}
            assetUrls={defaultEditorAssetUrls}
            overrides={{
              tools: (_editor, tools) => {
                // Remove the text tool
                delete tools.text;

                // 根据 OEM 配置控制 frame 工具（新建画板）
                const oneOnOne = get(oem, 'theme.designProjects.oneOnOne', false);
                if (oneOnOne === true) {
                  // 单画板模式：隐藏 frame 工具
                  delete tools.frame;
                }
                // 多画板模式：保留 frame 工具（默认行为）

                return tools;
              },
            }}
            assets={assetsStore}
          >
            {/* 小工具工具栏 - 根据 OEM 配置控制显示 */}
            {get(oem, 'theme.designProjects.showMiniToolsToolbar', false) && <MiniToolsToolbar />}
          </Tldraw>
        </TldrawErrorBoundary>
      </div>

      {/* Agent 面板已迁移至左侧 ExternalLayerPanel */}
    </div>
  );
};
