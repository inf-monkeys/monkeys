import React, { startTransition, useCallback, useEffect } from 'react';

import './index.scss';
import './layer-panel.css';

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
  TLComponents,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TLImageShape,
  TLShape,
  TLShapeId,
  TLUiContextMenuProps,
  useEditor,
  useToasts
} from 'tldraw';

import { ExternalLayerPanel } from './ExternalLayerPanel';
import { VerticalToolbar } from './vertical-toolbar.tsx';

import { useSystemConfig } from '@/apis/common';
import { useUniImagePreview } from '@/components/layout-wrapper/main/uni-image-preview';
import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';
import { getImageSize } from '@/utils/file';
import { get } from 'lodash';

import { useInfiniteWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper';
import { VinesTabular } from '@/components/layout/workspace/vines-view/form/tabular';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import type { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createExecutionStore, ExecutionStoreProvider } from '@/store/useExecutionStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { newConvertExecutionResultToItemList } from '@/utils/execution';
import { useEventEmitter } from 'ahooks';
import 'tldraw/tldraw.css';

class FixedFrameShapeUtil extends FrameShapeUtil {
  // override canResize() {
  //   return true;
  // }
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
function CustomContextMenu(props: TLUiContextMenuProps) {
  const editor = useEditor();
  const { addToast } = useToasts();
  const { openPreview } = useUniImagePreview();

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

  return (
    <DefaultContextMenu {...props}>
      <TldrawUiMenuGroup id="custom-actions">
        <TldrawUiMenuItem
          id="view-details"
          label="Show Image Detail"
          icon="info"
          readonlyOk
          onSelect={handleViewDetails}
        />
      </TldrawUiMenuGroup>
      <DefaultContextMenuContent />
    </DefaultContextMenu>
  );
}

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
  const miniEvent$ = useEventEmitter<any>();
  const insertedUrlSetRef = React.useRef<Set<string>>(new Set());
  const miniStartTimeRef = React.useRef<number>(0);
  const miniBaselineIdsRef = React.useRef<Set<string>>(new Set());
  const miniBaselineReadyRef = React.useRef<boolean>(false);
  const miniBaselineUrlsRef = React.useRef<Set<string>>(new Set());
  
  // 获取当前模式
  const oneOnOne = get(oem, 'theme.designProjects.oneOnOne', false);
  // 是否展示左侧 页面+图层 sidebar（默认 false）
  const showPageAndLayerSidebar = get(oem, 'theme.designProjects.showPageAndLayerSidebar', false);

  const createFrame = useCallback((editor: Editor, width: number, height: number) => {
    editor.createShape({
      type: 'frame',
      id: frameShapeId,
      x: 0,
      y: 0,
      props: {
        w: width,
        h: height,
        color: 'white',
        name: 'Design Board',
      },
    });

    // 设置视图以适应画板
    editor.zoomToFit();
  }, []);

  // 监听选中画板变化（多画板模式）
  useEffect(() => {
    if (!editor || oneOnOne === true) return;

    const handleSelectionChange = () => {
      const selectedShapes = editor.getSelectedShapes();
      const frameShape = selectedShapes.find(shape => shape.type === 'frame');
      
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
    
    if (get(oem, 'theme.designProjects.showContextMenu', true)) {
      comps.ContextMenu = CustomContextMenu;
    }
    
    
    return comps;
  }, [oem]); // 只有当oem发生变化时才重新创建
  
  console.log('Components config:', components);

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

  // 监听打开 mini 模式应用事件，记录当前 page 信息
  React.useEffect(() => {
    const handler = (e: any) => {
      const page = e?.detail?.page;
      if (page) setMiniPage(page);
    };
    window.addEventListener('vines:open-pinned-page-mini', handler as any);
    return () => window.removeEventListener('vines:open-pinned-page-mini', handler as any);
  }, []);

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
  React.useEffect(() => {
    if (!editor || !miniPage) return;
    const flat = (allOutputsPages?.flat() ?? []) as VinesWorkflowExecutionOutputListItem[];
    if (!flat?.length) return;
    const items = newConvertExecutionResultToItemList(flat);
    const workflowId = (miniPage?.workflowId || (miniPage as any)?.workflow?.id);
    const startMs = miniStartTimeRef.current || 0;
    // 初始化基线：首次看到的当前列表全部加入基线并跳过本轮插入
    if (!miniBaselineReadyRef.current) {
      const baseline = new Set<string>();
      const baselineUrls = new Set<string>();
      for (let i = 0; i < items.length; i++) {
        const raw = flat[i] as any;
        const conv = (items as any[])[i];
        const isSameWorkflow = conv?.workflowId === workflowId || raw?.workflowId === workflowId || raw?.workflow?.id === workflowId;
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
        const isSameWorkflow = conv?.workflowId === workflowId || raw?.workflowId === workflowId || raw?.workflow?.id === workflowId;
        if (!isSameWorkflow) continue;
        const rawId = raw?.id || conv?.id;
        if (rawId && miniBaselineIdsRef.current.has(String(rawId))) continue;
        const createdAtStr = raw?.createdAt || raw?.updatedAt || raw?.time || raw?.timestamp;
        const createdMs = createdAtStr ? new Date(createdAtStr).getTime() : 0;
        if (startMs && createdMs && createdMs < startMs) continue;
        if (String(conv?.render?.type).toLowerCase() !== 'image') continue;
        const url = conv?.render?.data as string;
        if (!url || insertedUrlSetRef.current.has(url)) continue;
        if (miniBaselineUrlsRef.current.has(url)) continue;
        try {
          const { width, height } = await getImageSize(url);
          const id = AssetRecordType.createId();
          editor.createAssets([{
            id,
            type: 'image',
            typeName: 'asset',
            props: { name: id, src: url, mimeType: 'image/png', isAnimated: false, h: height, w: width },
            meta: {},
          }]);
          editor.createShape({ type: 'image', props: { assetId: id, w: width, h: height } });
          insertedUrlSetRef.current.add(url);
          if (rawId) miniBaselineIdsRef.current.add(String(rawId));
        } catch {}
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
            width: '400px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: 'visible',
            ...(leftCollapsed ? {} : { })
          }}
        >
          {editor && <ExternalLayerPanel editor={editor} />}
        </div>
      )}

      {/* 折叠时：在左侧菜单下方 10px 显示一个嵌入 iframe 容器（暂不加载实际页面） */}
      {showPageAndLayerSidebar && leftCollapsed && miniPage && (
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '68px', // 10(top) + 48(menu) + 10(gap)
            width: '400px',
            // 高度与 page sidebar 一致：占据剩余空间到底部
            // 总高度(100%) - 顶部10 - 菜单48 - 间距10 - 底部10 = 100% - 78px
            height: 'calc(100% - 78px)',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 999,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {miniPage ? (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                {/* 缩放容器：整体缩小为 90%，并保持可滚动 */}
                <div style={{
                  transform: 'scale(0.9)',
                  transformOrigin: 'top left',
                  width: '111.111111%', /* 1 / 0.9，铺满容器 */
                }}>
                  <VinesFlowProvider workflowId={miniPage?.workflowId || miniPage?.workflow?.id || ''}>
                    <FlowStoreProvider createStore={createFlowStore}>
                      <CanvasStoreProvider createStore={createCanvasStore}>
                        <VinesViewWrapper workflowId={miniPage?.workflowId || miniPage?.workflow?.id}>
                          <ExecutionStoreProvider createStore={createExecutionStore}>
                            <VinesTabular className="h-full w-full" event$={miniEvent$} height={'100%'} />
                          </ExecutionStoreProvider>
                        </VinesViewWrapper>
                      </CanvasStoreProvider>
                    </FlowStoreProvider>
                  </VinesFlowProvider>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12 }}>
                请选择一个应用
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* tldraw容器 - 全屏显示 */}
      <div style={{ height: '100%' }}>
        <Tldraw
        persistenceKey={persistenceKey}
        onMount={(editor: Editor) => {
          setEditor(editor);
          editor.sideEffects.registerBeforeDeleteHandler('shape', (shape: TLShape) => {
            if (shape.id === frameShapeId) {
              return false;
            }
          });

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
            return nextShape;
          });

          // 如果提供了画布尺寸，则创建有界 frame
          if (canvasWidth && canvasHeight) {
            createFrame(editor, canvasWidth, canvasHeight);
          }
          editor.registerExternalContentHandler('url', async ({ url }) => {
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
        shapeUtils={[FixedFrameShapeUtil]}
        bindingUtils={defaultBindingUtils}
        tools={[...defaultShapeTools, ...defaultTools]}
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
        />
      </div>
    </div>
  );
};
