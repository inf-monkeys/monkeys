import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { mutate as swrMutate } from 'swr';

import { useDebounceFn, useEventEmitter, useMemoizedFn } from 'ahooks';
import { capitalize, get } from 'lodash';
import { ArrowLeft, Clipboard, History, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Editor, TLShapeId } from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { useWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { VinesTabular } from '@/components/layout/workspace/vines-view/form/tabular';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons';
import { useClipboard } from '@/hooks/use-clipboard';
import { useVinesFlow } from '@/package/vines-flow';
import { useMaskEditorStore } from '@/store/maskEditorStore';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createExecutionStore, ExecutionStoreProvider, useExecutionStore } from '@/store/useExecutionStore';
// swrMutate 已在顶部导入
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { newConvertExecutionResultToItemList } from '@/utils/execution';

import { VisibilityOff, VisibilityOn } from './icons';
// import { TldrawAgentV2EmbeddedPanel } from './panel-agent-v2-embedded';

// 形状类型中文映射
const getShapeTypeInChinese = (type: string, geoKind?: string): string => {
  // 几何形状的中文映射
  const geoShapeMap: { [key: string]: string } = {
    rectangle: '矩形',
    ellipse: '椭圆',
    triangle: '三角形',
    diamond: '菱形',
    pentagon: '五边形',
    hexagon: '六边形',
    octagon: '八边形',
    star: '星形',
    rhombus: '菱形',
    trapezoid: '梯形',
    'arrow-right': '右箭头',
    'arrow-left': '左箭头',
    'arrow-up': '上箭头',
    'arrow-down': '下箭头',
    'x-box': 'X形状',
    'check-box': '勾选框',
    cloud: '云形',
    heart: '心形',
  };

  // 基础形状类型的中文映射
  const shapeTypeMap: { [key: string]: string } = {
    frame: '画板',
    geo: geoKind ? geoShapeMap[geoKind] || capitalize(geoKind) : '几何图形',
    text: '文本',
    draw: '手绘',
    line: '线条',
    arrow: '箭头',
    note: '便签',
    image: '图片',
    video: '视频',
    embed: '嵌入',
    bookmark: '书签',
    highlight: '荧光笔',
  };

  return shapeTypeMap[type] || capitalize(type);
};

interface ExternalLayerPanelProps {
  editor: Editor;
  boardId?: string;
}

// 递归的形状项组件
const ShapeItem: React.FC<{
  shapeId: TLShapeId;
  editor: Editor;
  depth: number;
  parentIsSelected?: boolean;
  parentIsHidden?: boolean;
}> = ({ shapeId, editor, depth, parentIsSelected = false, parentIsHidden = false }) => {
  const [shape, setShape] = useState<any>(null);
  const [children, setChildren] = useState<TLShapeId[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [shapeName, setShapeName] = useState('');
  const [isEditingShapeName, setIsEditingShapeName] = useState(false);

  // 获取形状名称
  // 优先 meta.name；
  // frame: 优先 props.name；
  // geo: 使用 props.geo 的具体形状名（如 rectangle / ellipse 等），而不是统一的 Geo；
  // 其余：props.text / props.name；再退化为 util.getText 或类型名。
  const getShapeName = (editor: Editor, shapeId: TLShapeId): string => {
    const shape = editor.getShape(shapeId);
    if (!shape) return '未知形状';
    const metaName = (shape as any).meta?.name as string | undefined;
    const propsText = (shape as any).props?.text as string | undefined;
    const propsName = (shape as any).props?.name as string | undefined;
    const type = (shape as any).type as string;
    const geoKind = (shape as any).props?.geo as string | undefined;

    // 对 frame 优先读取 props.name（tldraw 默认即为"Frame"且可编辑），避免回退到"Frame shape"
    if (type === 'frame' && (propsName?.trim() || metaName?.trim())) {
      return (metaName?.trim() || propsName?.trim()) as string;
    }

    // 对 geo 使用具体图形名（如 Rectangle / Ellipse），避免统一显示为 Geo
    if (type === 'geo') {
      if (metaName?.trim()) return metaName.trim();
      if (propsName?.trim()) return propsName.trim();
      if (propsText?.trim()) return propsText.trim();
      if (geoKind) {
        return getShapeTypeInChinese('geo', geoKind);
      }
      return editor.getShapeUtil(shape).getText(shape) || getShapeTypeInChinese(type);
    }

    return (
      (metaName && metaName.trim()) ||
      (propsText && propsText.trim()) ||
      (propsName && propsName.trim()) ||
      editor.getShapeUtil(shape).getText(shape) ||
      getShapeTypeInChinese(type)
    );
  };

  // 更新形状状态
  const updateShapeState = () => {
    if (!editor) return;

    try {
      const currentShape = editor.getShape(shapeId);
      const currentChildren = editor.getSortedChildIdsForParent(shapeId);
      const currentIsHidden = (currentShape?.opacity ?? 1) === 0;
      const currentIsSelected = editor.getSelectedShapeIds().includes(shapeId);
      const currentShapeName = getShapeName(editor, shapeId);

      setShape(currentShape);
      setChildren(currentChildren);
      setIsHidden(currentIsHidden);
      setIsSelected(currentIsSelected);
      setShapeName(currentShapeName);
    } catch (error) {
      console.warn('Error updating shape state:', error);
    }
  };

  // 监听变化
  useEffect(() => {
    if (!editor) return;

    updateShapeState();

    const dispose = editor.store.listen(() => {
      updateShapeState();
    });

    return dispose;
  }, [editor, shapeId]);

  // 处理点击
  const handleClick = () => {
    if (!editor || !shape) return;

    try {
      if (editor.inputs.ctrlKey || editor.inputs.shiftKey) {
        if (isSelected) {
          editor.deselect(shape);
        } else {
          editor.select(...editor.getSelectedShapes(), shape);
        }
      } else {
        editor.select(shape);
      }
    } catch (error) {
      console.warn('Error selecting shape:', error);
    }
  };

  // 处理可见性切换
  const handleToggleVisibility = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!editor || !shape) return;

    try {
      // 通过更新形状的opacity来控制可见性
      const currentOpacity = shape.opacity ?? 1;
      const targetOpacity = currentOpacity > 0 ? 0 : 1;

      editor.updateShape({
        ...shape,
        opacity: targetOpacity,
      });
    } catch (error) {
      console.warn('Error toggling visibility:', error);
    }
  };

  // 重命名图层：同步到 meta.name 以及可能存在的 props 字段（text / name）
  const handleRenameShape = (newName: string) => {
    if (!editor || !shape) return;
    const trimmed = newName.trim();
    try {
      const next: any = { ...shape };
      next.meta = { ...(shape as any).meta, name: trimmed || shapeName };

      // 同步到常见可见文本字段
      if (next.props) {
        // 文本/便签
        if (typeof next.props.text === 'string') {
          next.props = { ...next.props, text: trimmed || shapeName };
        }
        // frame 的名称
        if (typeof next.props.name === 'string') {
          next.props = { ...next.props, name: trimmed || shapeName };
        }
      }

      editor.updateShape(next);
      setShapeName(trimmed || shapeName);
    } catch (e) {
      // ignore
    }
    setIsEditingShapeName(false);
  };

  if (!shape) return null;

  const selectedBg = '#E8F4FE';
  const childSelectedBg = '#F3F9FE';
  const childBg = '#00000006';

  return (
    <>
      <div
        className="shape-item"
        onClick={handleClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingShapeName(true);
        }}
        style={{
          paddingLeft: 10 + depth * 20,
          opacity: isHidden ? 0.5 : 1,
          background: isSelected ? selectedBg : parentIsSelected ? childSelectedBg : depth > 0 ? childBg : undefined,
        }}
      >
        {isEditingShapeName ? (
          <input
            autoFocus
            className="shape-name-input"
            defaultValue={shapeName}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => handleRenameShape(e.currentTarget.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') handleRenameShape((ev.target as HTMLInputElement).value);
              if (ev.key === 'Escape') setIsEditingShapeName(false);
            }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        ) : (
          <div className="shape-name">{shapeName}</div>
        )}
        <button className="shape-visibility-toggle" onClick={handleToggleVisibility}>
          {isHidden ? <VisibilityOff /> : <VisibilityOn />}
        </button>
      </div>

      {children.length > 0 && (
        <div>
          {children.map((childId) => (
            <ShapeItem
              key={childId}
              shapeId={childId}
              editor={editor}
              depth={depth + 1}
              parentIsSelected={parentIsSelected || isSelected}
              parentIsHidden={parentIsHidden || isHidden}
            />
          ))}
        </div>
      )}
    </>
  );
};

// 页面项组件
const PageItem: React.FC<{
  pageId: string;
  editor: Editor;
  isActive: boolean;
}> = ({ pageId, editor, isActive }) => {
  const [pageName, setPageName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // 获取页面名称
  const getPageName = () => {
    try {
      const page = editor.getPage(pageId as any);
      return page?.name || '未命名页面';
    } catch (error) {
      return '未命名页面';
    }
  };

  // 更新页面名称
  useEffect(() => {
    setPageName(getPageName());
  }, [pageId, editor]);

  // 监听页面变化
  useEffect(() => {
    if (!editor) return;

    const dispose = editor.store.listen(() => {
      setPageName(getPageName());
    });

    return dispose;
  }, [editor, pageId]);

  // 切换到此页面
  const handlePageClick = () => {
    if (!isActive) {
      editor.setCurrentPage(pageId as any);
    }
  };

  // 重命名页面
  const handleRename = (newName: string) => {
    if (newName.trim() && newName !== pageName) {
      try {
        editor.renamePage(pageId as any, newName.trim());
      } catch (error) {
        console.warn('Error renaming page:', error);
      }
    }
    setIsEditingName(false);
  };

  return (
    <div
      className="page-item"
      onClick={handlePageClick}
      onDoubleClick={() => setIsEditingName(true)}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#E8F4FE' : 'transparent',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {isEditingName ? (
        <input
          autoFocus
          className="page-name-input"
          defaultValue={pageName}
          onBlur={() => setIsEditingName(false)}
          onChange={(ev) => handleRename(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === 'Escape') {
              handleRename(ev.currentTarget.value);
            }
          }}
          style={{
            border: 'none',
            background: 'none',
            outline: 'none',
            fontSize: '13px',
            width: '100%',
          }}
        />
      ) : (
        <div style={{ fontSize: '13px', fontWeight: isActive ? 'bold' : 'normal' }}>{pageName}</div>
      )}
    </div>
  );
};

// 在黄色块中渲染的按钮组件的包装器
const MiniTabularButtonsWrapper: React.FC<{ miniPage: any; useAbsolutePosition?: boolean }> = ({
  miniPage,
  useAbsolutePosition = true,
}) => {
  const [tabular$, setTabular$] = useState<any>(null);

  useEffect(() => {
    // 等待 tabular event 被创建
    const checkTabularEvent = setInterval(() => {
      if ((window as any).tabularEventRef) {
        setTabular$((window as any).tabularEventRef);
        clearInterval(checkTabularEvent);
      }
    }, 100);

    return () => clearInterval(checkTabularEvent);
  }, []);

  return (
    <VinesFlowProvider workflowId={miniPage?.workflowId || miniPage?.workflow?.id || ''}>
      <FlowStoreProvider createStore={createFlowStore}>
        <ExecutionStoreProvider createStore={createExecutionStore}>
          {tabular$ ? (
            <MiniTabularButtons tabular$={tabular$} useAbsolutePosition={useAbsolutePosition} />
          ) : (
            <div
              style={{
                position: useAbsolutePosition ? 'absolute' : 'relative',
                bottom: useAbsolutePosition ? 0 : undefined,
                height: '60px',
                background: '#fff',
              }}
            >
              {/* Tabular buttons will render here */}
            </div>
          )}
        </ExecutionStoreProvider>
      </FlowStoreProvider>
    </VinesFlowProvider>
  );
};

// 在黄色块中渲染的按钮组件
const MiniTabularButtons: React.FC<{ tabular$: any; useAbsolutePosition?: boolean }> = ({
  tabular$,
  useAbsolutePosition = true,
}) => {
  const { t } = useTranslation();
  const { data: oem } = useSystemConfig();
  const { vines } = useVinesFlow();
  const { read } = useClipboard({ showSuccess: false });
  const { status: executionStatus } = useExecutionStore();
  const { isEditorOpen } = useMaskEditorStore();

  const allowConcurrentRuns = get(oem, 'theme.workflow.allowConcurrentRuns', true);
  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;
  const isInputNotEmpty = vines.workflowInput.length > 0;

  const handlePasteInput = useMemoizedFn(async () => {
    const text = await read();
    if (text) {
      try {
        const inputData = JSON.parse(text);
        if (inputData.type === 'input-parameters') {
          tabular$.emit({ type: 'paste-param', data: inputData.data });
        } else {
          toast.error(t('workspace.form-view.quick-toolbar.paste-param.bad-content'));
        }
      } catch (error) {
        toast.error(t('workspace.form-view.quick-toolbar.paste-param.bad-content'));
      }
    }
  });

  const debouncedSubmit = useDebounceFn(
    () => {
      tabular$.emit('submit');
    },
    { wait: 300 },
  );

  return (
    <div
      style={{
        ...(useAbsolutePosition
          ? {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }
          : {
              position: 'relative',
              marginTop: '12px',
            }),
        width: '100%',
        minHeight: '60px',
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        ...(useAbsolutePosition
          ? {
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px',
            }
          : {}),
        zIndex: 10,
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {isInputNotEmpty && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="!px-2.5"
                variant="outline"
                theme="primary"
                onClick={() => tabular$.emit('restore-previous-param')}
                icon={<Undo2 />}
                size="small"
              />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.form-view.quick-toolbar.restore-previous-param.label')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="!px-2.5"
                variant="outline"
                theme="primary"
                onClick={() => tabular$.emit('reset')}
                icon={<RotateCcw />}
                size="small"
              />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.form-view.quick-toolbar.reset')}</TooltipContent>
          </Tooltip>
        </>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="!px-2.5"
            variant="outline"
            theme="primary"
            onClick={handlePasteInput}
            icon={<Clipboard />}
            size="small"
          />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.form-view.quick-toolbar.paste-param.label')}</TooltipContent>
      </Tooltip>
      <Button
        variant="solid"
        className="flex-1 text-base"
        onClick={debouncedSubmit.run}
        size="with-icon"
        disabled={openAIInterfaceEnabled || isEditorOpen}
        icon={<Sparkles className="fill-white" />}
      >
        {t(
          openAIInterfaceEnabled
            ? 'workspace.pre-view.disable.exec-button-tips'
            : isEditorOpen
              ? 'workspace.pre-view.actuator.execution.mask-editor-open-tips'
              : 'workspace.pre-view.actuator.execution.label',
        )}
      </Button>
    </div>
  );
};

export const ExternalLayerPanel: React.FC<ExternalLayerPanelProps> = ({ editor, boardId }) => {
  const SUBMENU_WIDTH = 220;
  const [currentPageShapeIds, setCurrentPageShapeIds] = useState<TLShapeId[]>([]);
  const [pages, setPages] = useState<{ id: string; name: string }[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [pagesSectionHeight, setPagesSectionHeight] = useState(200); // 页面部分的高度
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // 页面搜索查询
  const [isPageSectionCollapsed, setIsPageSectionCollapsed] = useState(false); // 页面区域是否收起
  const [totalAvailableHeight, setTotalAvailableHeight] = useState(0); // 可用的总高度
  const [isSearchVisible, setIsSearchVisible] = useState(false); // 搜索框是否显示
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // 更多菜单是否打开
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false); // 编辑菜单是否打开
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false); // 视图菜单是否打开
  const [isPrefsMenuOpen, setIsPrefsMenuOpen] = useState(false); // 偏好菜单是否打开
  const [isCopyAsOpen, setIsCopyAsOpen] = useState(false); // "复制为" 子菜单
  const [isExportAsOpen, setIsExportAsOpen] = useState(false); // "导出为" 子菜单
  const [isExportAllAsOpen, setIsExportAllAsOpen] = useState(false); // "全部导出为" 子菜单
  const copyCloseTimerRef = useRef<number | undefined>(undefined);
  const exportCloseTimerRef = useRef<number | undefined>(undefined);
  const exportAllCloseTimerRef = useRef<number | undefined>(undefined);
  const prefsCloseTimerRef = useRef<number | undefined>(undefined);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false); // 语言菜单
  const langCloseTimerRef = useRef<number | undefined>(undefined);

  // mini iframe 集成：折叠时显示
  const [miniPage, setMiniPage] = useState<any | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(8);
  const miniEvent$ = useEventEmitter<any>();
  // 等待中历史占位（任务创建后、结果返回前）
  const [pendingHistory, setPendingHistory] = useState<
    Array<{ instanceId: string; workflowId?: string | null; time: number; renderData?: any }>
  >([]);
  // agent 嵌入：在左侧 sidebar 内显示
  const [agentVisible, setAgentVisible] = useState(false);
  // 等待占位动画样式仅注入一次（正方形+中心旋转）
  if (typeof document !== 'undefined' && !document.getElementById('mini-history-waiting-styles')) {
    const css = `
      @keyframes vinesSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .mini-history-waiting { display: flex; align-items: center; justify-content: center; }
      .mini-history-waiting .spinner { width: 28px; height: 28px; border: 3px solid #e5e7eb; border-top-color: #9ca3af; border-radius: 9999px; animation: vinesSpin 0.9s linear infinite; }
    `;
    const st = document.createElement('style');
    st.id = 'mini-history-waiting-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }
  useEffect(() => {
    const onCreated = (e: any) => {
      const instanceId = e?.detail?.instanceId;
      const workflowId = e?.detail?.workflowId ?? (miniPage?.workflowId || miniPage?.workflow?.id);
      if (!instanceId || !workflowId) return;
      setPendingHistory((list) => [
        { instanceId, workflowId, time: Date.now() },
        ...list.filter((i) => i.instanceId !== instanceId),
      ]);
    };
    const onCompleted = (e: any) => {
      const instanceId = e?.detail?.instanceId;
      if (!instanceId) return;
      const renderData = e?.detail?.render?.data;
      // 立即触发历史接口刷新
      swrMutate(`/api/workflow/executions/all/outputs?limit=1000&page=1`);
      // 如果有结果渲染数据，先乐观替换为完成内容，再在几秒后移除（等待后端返回）
      if (renderData) {
        setPendingHistory((list) =>
          list.map((i) => (i.instanceId === instanceId ? { ...i, renderData, time: Date.now() } : i)),
        );
        setTimeout(() => {
          setPendingHistory((list) => list.filter((i) => i.instanceId !== instanceId));
        }, 5000);
      } else {
        // 无可渲染数据，短延迟后移除
        setTimeout(() => {
          setPendingHistory((list) => list.filter((i) => i.instanceId !== instanceId));
        }, 1500);
      }
    };
    window.addEventListener('vines:create-placeholder', onCreated as any);
    window.addEventListener('vines:mini-execution-completed', onCompleted as any);
    return () => {
      window.removeEventListener('vines:create-placeholder', onCreated as any);
      window.removeEventListener('vines:mini-execution-completed', onCompleted as any);
    };
  }, [miniPage]);

  const formatTime = useCallback((timestamp: number | string | undefined) => {
    if (!timestamp) return '';
    let ts: any = timestamp;
    if (typeof ts === 'string') {
      ts = parseInt(ts, 10);
      if (isNaN(ts)) return '';
    }
    if (ts < 1e12) ts = ts * 1000;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }, []);

  useEffect(() => {
    const toggle = () => setAgentVisible((v) => !v);
    window.addEventListener('vines:toggle-agent-embed', toggle as any);
    return () => window.removeEventListener('vines:toggle-agent-embed', toggle as any);
  }, []);
  // 获取执行历史（用于历史记录视图）
  const { data: allOutputsPages } = useWorkflowExecutionAllOutputs({ limit: 1000, page: 1 });
  // 当后端数据返回包含某个 pending 的 instanceId 时，立即移除对应等待项
  useEffect(() => {
    try {
      const items = newConvertExecutionResultToItemList(allOutputsPages ?? []);
      const instanceSet = new Set<string>((items || []).map((it: any) => String(it?.instanceId || '')));
      setPendingHistory((list) => list.filter((p) => !instanceSet.has(String(p.instanceId))));
    } catch {}
  }, [allOutputsPages]);
  // 文本归一化：支持多语言对象 { 'zh-CN': '...', en: '...' }
  const normalizeText = useCallback((val: any): string => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      try {
        const lang = (navigator?.language || 'en').toLowerCase();
        const candidates = [lang, lang.replace('-', '_'), 'zh-CN', 'zh_cn', 'zh', 'en'];
        for (const key of candidates) {
          const v = (val as any)[key];
          if (typeof v === 'string' && v.trim()) return v;
        }
        const first = Object.values(val).find((v) => typeof v === 'string' && (v as string).trim());
        if (typeof first === 'string') return first;
      } catch {}
    }
    return '';
  }, []);
  useEffect(() => {
    const openHandler = (e: any) => {
      const next = e?.detail?.page || e?.detail || null;
      setMiniPage(next);
      const workflowId = next?.workflowId || next?.workflow?.id || null;
      window.dispatchEvent(new CustomEvent('vines:mini-state', { detail: { pageId: next?.id || null, workflowId } }));
    };
    const closeHandler = () => {
      setMiniPage(null);
      window.dispatchEvent(new CustomEvent('vines:mini-state', { detail: { pageId: null, workflowId: null } }));
    };
    window.addEventListener('vines:open-pinned-page-mini', openHandler as any);
    window.addEventListener('vines:close-pinned-page-mini', closeHandler as any);
    return () => {
      window.removeEventListener('vines:open-pinned-page-mini', openHandler as any);
      window.removeEventListener('vines:close-pinned-page-mini', closeHandler as any);
    };
  }, []);

  // 当历史记录打开时，重置页码为1
  useEffect(() => {
    if (historyOpen) {
      setHistoryPage(1);
    }
  }, [historyOpen]);

  // 根据页面高度计算历史记录每页显示的数量
  useEffect(() => {
    if (!miniPage || !historyOpen) return;

    // 固定显示8张图片，不需要自适应
    // const timer = setTimeout(() => {
    //   // 假设每行高度约 90px（图片高度）+ 8px（gap）= 98px
    //   // 标题高度：40px，分页组件高度：60px
    //   // 可用高度 = 面板高度 - 标题 - 分页组件
    //   const itemHeight = 98;
    //   const headerHeight = 40;
    //   const paginationHeight = 60;
    //   const padding = 24; // 上下 padding
    //
    //   // 获取面板高度
    //   const panel = document.querySelector('.layer-panel-content');
    //   if (panel) {
    //     const panelHeight = panel.clientHeight;
    //     const availableHeight = panelHeight - headerHeight - paginationHeight - padding;
    //     const rows = Math.floor(availableHeight / itemHeight);
    //     const itemsPerPage = Math.max(4, rows * 2); // 每行2个，至少显示4个
    //     setHistoryPageSize(itemsPerPage);
    //   }
    // }, 100);

    // return () => clearTimeout(timer);
  }, [miniPage, historyOpen]);

  // 折叠：左侧除顶栏外的区域
  const [isLeftBodyCollapsed, setIsLeftBodyCollapsed] = useState(false);

  // 监听全局折叠事件（来自快捷按钮点击时的外部触发）
  useEffect(() => {
    const handler = (e: any) => {
      const collapsed = Boolean(e?.detail?.collapsed);
      setIsLeftBodyCollapsed(collapsed);
    };
    window.addEventListener('vines:toggle-left-sidebar-body', handler as any);
    return () => window.removeEventListener('vines:toggle-left-sidebar-body', handler as any);
  }, []);

  const supportedLocales = useMemo(
    () => [
      { code: 'en', label: 'English' },
      { code: 'zh-cn', label: '简体中文' },
      { code: 'zh-tw', label: '繁體中文' },
      { code: 'ja', label: '日本語' },
      { code: 'ko', label: '한국어' },
      { code: 'de', label: 'Deutsch' },
      { code: 'fr', label: 'Français' },
      { code: 'es', label: 'Español' },
      { code: 'pt-br', label: 'Português (Brasil)' },
      { code: 'ru', label: 'Русский' },
      { code: 'it', label: 'Italiano' },
      { code: 'nl', label: 'Nederlands' },
      { code: 'tr', label: 'Türkçe' },
      { code: 'pl', label: 'Polski' },
    ],
    [],
  );

  const getCurrentLocale = () => {
    try {
      return (editor as any).user?.getUserPreferences?.().locale ?? 'en';
    } catch {
      return 'en';
    }
  };

  // 偏好：状态
  const [prefsState, setPrefsState] = useState({
    isSnapMode: false,
    isToolLocked: false,
    isGridMode: false,
    isWrapSelection: false,
    isFocusMode: false,
    isEdgeScrolling: true,
    isReducedMotion: false,
    isDynamicSizeMode: true,
    isPasteAtCursor: true,
    isDebugMode: false,
  });

  const refreshPrefsState = useCallback(() => {
    try {
      const inst = (editor as any).getInstanceState?.() || {};
      setPrefsState((prev) => ({
        ...prev,
        isSnapMode: Boolean(inst.isSnapMode ?? prev.isSnapMode),
        isToolLocked: Boolean((editor as any).getIsToolLocked?.() ?? inst.isToolLocked ?? prev.isToolLocked),
        isGridMode: Boolean(inst.isGridMode ?? prev.isGridMode),
        isWrapSelection: Boolean(inst.isWrapSelection ?? prev.isWrapSelection),
        isFocusMode: Boolean(inst.isFocusMode ?? prev.isFocusMode),
        isEdgeScrolling: Boolean(inst.isEdgeScrolling ?? prev.isEdgeScrolling),
        // 以下字段在部分版本不存在，读取时保持原值，避免引用不存在的键
        isReducedMotion: Boolean((inst as any).isReducedMotion ?? prev.isReducedMotion),
        isDynamicSizeMode: Boolean((inst as any).isDynamicSizeMode ?? prev.isDynamicSizeMode),
        isPasteAtCursor: Boolean((inst as any).isPasteAtCursor ?? prev.isPasteAtCursor),
        isDebugMode: Boolean((inst as any).isDebugMode ?? prev.isDebugMode),
      }));
    } catch {}
  }, [editor]);

  useEffect(() => {
    if (isPrefsMenuOpen) refreshPrefsState();
  }, [isPrefsMenuOpen, refreshPrefsState]);

  const togglePref = async (key: keyof typeof prefsState) => {
    try {
      const next = !prefsState[key];
      const inst = (editor as any).getInstanceState?.() || {};
      // 仅在实例状态包含该键时更新，避免 schema 校验错误
      if (Object.prototype.hasOwnProperty.call(inst, key)) {
        const payload: any = {};
        payload[key] = next;
        (editor as any).updateInstanceState?.(payload);
      }
      // 特定 API 兜底
      if (key === 'isToolLocked') {
        (editor as any).setIsToolLocked?.(next);
      }
      setPrefsState((s) => ({ ...s, [key]: next }));
    } catch {}
  };
  const [transparentExport, setTransparentExport] = useState(true); // 导出透明背景
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [hasSelectionState, setHasSelectionState] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null); // 整个面板的引用
  const topBarRef = useRef<HTMLDivElement>(null); // 顶部菜单栏引用

  // 更新页面列表
  const updatePages = () => {
    if (!editor) return;

    try {
      const allPages = editor.getPages();
      const pageList = allPages.map((page) => ({
        id: page.id,
        name: page.name || '未命名页面',
      }));
      setPages(pageList);
      setCurrentPageId(editor.getCurrentPageId());
    } catch (error) {
      console.warn('Error updating pages:', error);
    }
  };

  // 更新当前页面的顶级形状
  const updateCurrentPageShapes = () => {
    if (!editor) return;

    try {
      const currentPageId = editor.getCurrentPageId();
      const shapeIds = editor.getSortedChildIdsForParent(currentPageId);
      setCurrentPageShapeIds(shapeIds);
    } catch (error) {
      console.warn('Error updating current page shapes:', error);
    }
  };

  // 监听编辑器变化
  useEffect(() => {
    if (!editor) return;

    updatePages();
    updateCurrentPageShapes();
    recomputeEditCapabilities();

    const dispose = editor.store.listen(() => {
      updatePages();
      updateCurrentPageShapes();
      recomputeEditCapabilities();
    });

    return dispose;
  }, [editor]);

  // 计算可用的总高度
  const calculateAvailableHeight = useCallback(() => {
    if (!panelRef.current) return;

    const panelHeight = panelRef.current.clientHeight;

    // 计算固定元素的高度
    const pageHeaderHeight = 50; // 页面标题栏高度
    const layerHeaderHeight = 50; // 图层标题栏高度
    const dragHandleHeight = isPageSectionCollapsed ? 0 : 8; // 拖拽手柄高度
    const fixedHeight = pageHeaderHeight + layerHeaderHeight + dragHandleHeight;

    const available = Math.max(200, panelHeight - fixedHeight);
    setTotalAvailableHeight(available);

    // 调整页面高度范围
    const minPageHeight = 100;
    const maxPageHeight = Math.max(minPageHeight, available - 150); // 给图层区域至少留150px

    if (pagesSectionHeight > maxPageHeight) {
      setPagesSectionHeight(maxPageHeight);
    } else if (pagesSectionHeight < minPageHeight) {
      setPagesSectionHeight(minPageHeight);
    }
  }, [isPageSectionCollapsed, pagesSectionHeight]);

  // 监听窗口大小变化和初始化
  useEffect(() => {
    // 延迟计算，确保DOM已经渲染
    const timer = setTimeout(() => {
      calculateAvailableHeight();
    }, 200);

    const handleResize = () => {
      calculateAvailableHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateAvailableHeight]);

  // 点击外部关闭更多菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreMenuOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
        setIsEditMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen, isEditMenuOpen]);

  // 计算编辑能力
  const recomputeEditCapabilities = useCallback(() => {
    try {
      // 兼容不同版本/实例上的接口
      const canUndo = Boolean(
        (editor as any)?.canUndo?.() ?? (editor as any)?.getCanUndo?.() ?? (editor as any)?.history?.canUndo?.(),
      );
      const canRedo = Boolean(
        (editor as any)?.canRedo?.() ?? (editor as any)?.getCanRedo?.() ?? (editor as any)?.history?.canRedo?.(),
      );
      const hasSel = (editor.getSelectedShapes?.()?.length || 0) > 0;
      setCanUndoState(canUndo);
      setCanRedoState(canRedo);
      setHasSelectionState(hasSel);
    } catch (_) {
      setCanUndoState(false);
      setCanRedoState(false);
      setHasSelectionState(false);
    }
  }, [editor]);

  // 菜单开合或选区变化都触发一次刷新
  useEffect(() => {
    recomputeEditCapabilities();
  }, [isMoreMenuOpen, isEditMenuOpen, hasSelectionState, recomputeEditCapabilities]);

  // 编辑功能实现
  const handleUndo = () => {
    editor.undo();
  };

  const handleRedo = () => {
    editor.redo();
  };

  const handleCut = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length > 0) {
      // 使用键盘事件模拟剪切
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  const handleCopy = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length > 0) {
      // 使用键盘事件模拟复制
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  const handlePaste = () => {
    // 使用键盘事件模拟粘贴
    const event = new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const handleDuplicate = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length > 0) {
      editor.duplicateShapes(selectedShapes.map((shape) => shape.id));
    }
  };

  const handleDelete = () => {
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length > 0) {
      editor.deleteShapes(selectedShapes.map((shape) => shape.id));
    }
  };

  const handleSelectAll = () => {
    editor.selectAll();
  };

  // 视图：缩放/适配 等
  const handleZoomIn = () => {
    try {
      (editor as any).zoomIn?.();
    } catch {}
  };

  const handleZoomOut = () => {
    try {
      (editor as any).zoomOut?.();
    } catch {}
  };

  const handleZoomTo100 = () => {
    try {
      if ((editor as any).resetZoom) {
        (editor as any).resetZoom();
        return;
      }
      (editor as any).setCamera?.({
        ...((editor as any).getCamera?.() || {}),
        zoom: 1,
      });
    } catch {}
  };

  const handleZoomToFit = () => {
    try {
      if ((editor as any).zoomToFit) {
        (editor as any).zoomToFit();
        return;
      }
      const bounds = (editor as any).getCurrentPageBounds?.();
      if (bounds) {
        (editor as any).zoomToBounds?.(bounds, { inset: 32 });
      }
    } catch {}
  };

  const handleZoomToSelection = () => {
    try {
      if ((editor as any).zoomToSelection) {
        (editor as any).zoomToSelection();
        return;
      }
      const selBounds = (editor as any).getSelectionPageBounds?.();
      if (selBounds) {
        (editor as any).zoomToBounds?.(selBounds, { inset: 32 });
      }
    } catch {}
  };

  // 公共：获取需要导出的 shapeIds（优先选中，默认当前页根下所有）
  const getExportIds = (): any[] => {
    try {
      const selected = editor.getSelectedShapeIds?.() || [];
      if (selected.length > 0) return selected as any[];
      const pageShapes = (editor as any).getCurrentPageShapes?.() as { id: string }[] | undefined;
      if (Array.isArray(pageShapes) && pageShapes.length > 0) return pageShapes.map((s) => s.id);
      const pageId = editor.getCurrentPageId?.();
      const childIds = (editor as any).getSortedChildIdsForParent?.(pageId) as any[] | undefined;
      if (Array.isArray(childIds) && childIds.length > 0) return childIds;
    } catch {}
    return [] as any[];
  };

  // 生成透明背景 SVG 字符串
  const buildTransparentSvg = async (ids: any[], transparent: boolean) => {
    const r = await (editor as any).getSvg?.(ids.length ? ids : undefined, { scale: 1, background: 'transparent' });
    if (!r) return null;
    const res = r as any;
    const svgEl: SVGSVGElement = (res instanceof SVGElement ? res : res?.svg) as SVGSVGElement;
    if (!svgEl) return null;
    // 补齐必要属性
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    if (!svgEl.getAttribute('viewBox') && res?.viewBox) svgEl.setAttribute('viewBox', res.viewBox);
    if (!svgEl.getAttribute('width') && res?.width) svgEl.setAttribute('width', String(res.width));
    if (!svgEl.getAttribute('height') && res?.height) svgEl.setAttribute('height', String(res.height));
    if (transparent) {
      svgEl.style.background = 'none';
      svgEl.setAttribute('style', 'background:none');
    }
    const body = new XMLSerializer().serializeToString(svgEl);
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlHeader + body;
  };

  // 复制/导出：SVG（透明）
  const handleCopyAsSvg = async () => {
    const ids = getExportIds();
    const svgText = await buildTransparentSvg(ids, true);
    if (!svgText) return;
    // 优先富类型写入，覆盖更多粘贴目标（矢量与富文本）
    try {
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const htmlText = svgText.replace(/^<\?xml[^>]*>\s*/i, '');
      const htmlBlob = new Blob([htmlText], { type: 'text/html' });
      const textBlob = new Blob([svgText], { type: 'text/plain' });

      const ClipboardItemCtor = (window as any).ClipboardItem;
      if (ClipboardItemCtor && (navigator as any).clipboard?.write) {
        const item = new ClipboardItemCtor({
          'image/svg+xml': svgBlob,
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await (navigator as any).clipboard.write([item]);
        return;
      }
    } catch {}
    // 回退：纯文本写入
    try {
      await navigator.clipboard.writeText(svgText);
      return;
    } catch {}
    // 最后兜底：使用隐藏 textarea 复制
    try {
      const ta = document.createElement('textarea');
      ta.value = svgText;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.blur();
      ta.remove();
      return;
    } catch {}
    // 再兜底：直接下载
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleExportSvg = async () => {
    const ids = getExportIds();
    const svgText = await buildTransparentSvg(ids, true);
    if (!svgText) return;
    const a = document.createElement('a');
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    a.href = dataUrl;
    a.download = `export-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
    }, 0);
  };

  // 利用 SVG 渲染到 Canvas，导出 PNG，保证透明
  const svgToPngBlob = async (svgText: string): Promise<Blob | null> => {
    return await new Promise((resolve) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      // blob URL 不需要设置 crossOrigin
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        // 不填充背景 => 透明
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          URL.revokeObjectURL(url);
          resolve(b);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  // 复制/导出：PNG（透明可选，默认透明）
  const handleCopyAsPng = async () => {
    const ids = getExportIds();
    // 优先使用 tldraw 内置导出（更稳定）；若失败再走 svg->canvas
    try {
      const r1 = await (editor as any).toImage?.(ids.length ? ids : undefined, {
        format: 'png',
        background: transparentExport ? 'transparent' : undefined,
        scale: 1,
      });
      if (r1?.blob) {
        try {
          await (navigator as any).clipboard.write?.([new (window as any).ClipboardItem({ 'image/png': r1.blob })]);
          return;
        } catch {}
        const url = URL.createObjectURL(r1.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 0);
        return;
      }
    } catch {}
    // 兜底：svg->png
    const svgText = await buildTransparentSvg(ids, transparentExport);
    if (!svgText) return;
    const blob = await svgToPngBlob(svgText);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleExportPng = async () => {
    const ids = getExportIds();
    try {
      const r2 = await (editor as any).toImage?.(ids.length ? ids : undefined, {
        format: 'png',
        background: transparentExport ? 'transparent' : undefined,
        scale: 1,
      });
      if (r2?.blob) {
        const url = URL.createObjectURL(r2.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 0);
        return;
      }
    } catch {}
    // 兜底：svg->png
    const svgText = await buildTransparentSvg(ids, transparentExport);
    if (!svgText) return;
    const blob = await svgToPngBlob(svgText);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  // 全部导出：辅助函数
  const exportWholePageAsSvg = async (pageId: string, pageName: string) => {
    try {
      const childIds = (editor as any).getSortedChildIdsForParent?.(pageId) as any[] | undefined;
      const ids = Array.isArray(childIds) ? childIds : [];
      const svgText = await buildTransparentSvg(ids, true);
      if (!svgText) return;
      const a = document.createElement('a');
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
      a.href = dataUrl;
      a.download = `${pageName || 'Page'}-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
    } catch {}
  };

  const exportWholePageAsPng = async (pageId: string, pageName: string) => {
    try {
      const childIds = (editor as any).getSortedChildIdsForParent?.(pageId) as any[] | undefined;
      const ids = Array.isArray(childIds) ? childIds : [];
      const r = await (editor as any).toImage?.(ids.length ? ids : undefined, {
        format: 'png',
        background: transparentExport ? 'transparent' : undefined,
        scale: 1,
      });
      if (r?.blob) {
        const url = URL.createObjectURL(r.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageName || 'Page'}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 0);
        return;
      }
      // 兜底：svg->png
      const svgText = await buildTransparentSvg(ids, transparentExport);
      if (!svgText) return;
      const blob = await svgToPngBlob(svgText);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pageName || 'Page'}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 0);
    } catch {}
  };

  // 检查功能可用性（使用 state，随编辑器变化而更新）
  const canUndo = canUndoState;
  const canRedo = canRedoState;
  const hasSelection = hasSelectionState;
  const canPaste = true; // 粘贴通常总是可用的

  // 当收起状态改变时重新计算
  useEffect(() => {
    calculateAvailableHeight();
  }, [isPageSectionCollapsed, calculateAvailableHeight]);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(pagesSectionHeight);
    e.preventDefault();
  };

  // 处理拖拽中
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || totalAvailableHeight === 0) return;

      const deltaY = e.clientY - dragStartY;
      const newHeight = dragStartHeight + deltaY;

      // 动态计算最小和最大高度
      const minHeight = 100; // 最小100px
      const maxHeight = Math.max(minHeight, totalAvailableHeight - 150); // 给图层区域至少留150px

      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      setPagesSectionHeight(constrainedHeight);
    },
    [isDragging, dragStartY, dragStartHeight, totalAvailableHeight],
  );

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 监听全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 处理添加新页面
  const handleAddPage = () => {
    if (!editor) return;

    try {
      const newPageName = `页面 ${pages.length + 1}`;
      const newPage = editor.createPage({ name: newPageName });
      editor.setCurrentPage(newPage.id as any);
    } catch (error) {
      console.warn('Error adding new page:', error);
    }
  };

  // 处理收起/展开页面区域
  const handleTogglePageSection = () => {
    setIsPageSectionCollapsed(!isPageSectionCollapsed);
  };

  // 过滤页面列表（基于搜索查询）
  const filteredPages = pages.filter((page) => page.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // 计算图层区域的动态高度
  const layersHeight = useMemo(() => {
    if (totalAvailableHeight <= 0) return 'auto';

    if (isPageSectionCollapsed) {
      // 页面区域收起时，图层区域占据所有可用高度（减去顶部按钮栏高度）
      return totalAvailableHeight - 50 - 48; // 减去图层标题栏高度和顶部按钮栏高度
    } else {
      // 页面区域展开时，图层区域 = 总高度 - 页面区域高度 - 图层标题栏高度 - 顶部按钮栏高度
      const calculated = totalAvailableHeight - pagesSectionHeight - 50 - 48;
      const minLayersHeight = 100; // 图层区域最小高度
      return Math.max(minLayersHeight, calculated);
    }
  }, [totalAvailableHeight, isPageSectionCollapsed, pagesSectionHeight]);

  return (
    <div
      ref={panelRef}
      className={`layer-panel-content${isLeftBodyCollapsed ? 'collapsed' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 顶部按钮栏 */}
      <div
        ref={topBarRef}
        className="top-button-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #e1e1e1',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {/* 更多菜单按钮 */}
          <div style={{ position: 'relative' }}>
            <button
              className={`top-button ${isMoreMenuOpen ? 'active' : ''}`}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e5e7eb',
                background: isMoreMenuOpen ? '#f3f4f6' : '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#111',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111';
              }}
              onMouseLeave={(e) => {
                if (!isMoreMenuOpen) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#111';
                }
              }}
              title="更多菜单"
            >
              ☰
            </button>

            {/* 下拉菜单 */}
            {isMoreMenuOpen && (
              <div
                className="more-menu-dropdown"
                style={{
                  position: 'absolute',
                  top: '36px',
                  left: '0',
                  background: 'white',
                  border: '1px solid #e1e1e1',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 10000,
                  minWidth: `${SUBMENU_WIDTH}px`,
                  padding: '4px 0',
                }}
              >
                {/* 编辑 */}
                <div
                  style={{ position: 'relative' }}
                  onMouseLeave={() => {
                    setIsEditMenuOpen(false);
                    setIsCopyAsOpen(false);
                    setIsExportAsOpen(false);
                  }}
                >
                  <div
                    className="menu-item"
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#333',
                    }}
                    onMouseEnter={() => setIsEditMenuOpen(true)}
                  >
                    <span>编辑</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                  </div>

                  {/* 编辑子菜单 */}
                  {isEditMenuOpen && (
                    <div
                      className="edit-submenu"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: '0',
                        background: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 10001,
                        minWidth: `${SUBMENU_WIDTH}px`,
                        padding: '4px 0',
                      }}
                      onMouseEnter={() => setIsEditMenuOpen(true)}
                    >
                      {/* 撤销 */}
                      <div
                        className={`menu-item ${!canUndo ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: canUndo ? '#333' : '#999',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canUndo) {
                            handleUndo();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>撤销</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL Z</span>
                      </div>

                      {/* 重做 */}
                      <div
                        className={`menu-item ${!canRedo ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: canRedo ? '#333' : '#999',
                          opacity: canRedo ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canRedo) {
                            handleRedo();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>重做</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL ↑ Z</span>
                      </div>

                      {/* 分隔线 */}
                      <div
                        style={{
                          height: '1px',
                          background: '#e1e1e1',
                          margin: '4px 0',
                        }}
                      ></div>

                      {/* 剪切 */}
                      <div
                        className={`menu-item ${!hasSelection ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: hasSelection ? '#333' : '#999',
                          opacity: hasSelection ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSelection) {
                            handleCut();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>剪切</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL X</span>
                      </div>

                      {/* 复制 */}
                      <div
                        className={`menu-item ${!hasSelection ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: hasSelection ? '#333' : '#999',
                          opacity: hasSelection ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSelection) {
                            handleCopy();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>复制</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL C</span>
                      </div>

                      {/* 粘贴 */}
                      <div
                        className={`menu-item ${!canPaste ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: canPaste ? '#333' : '#999',
                          opacity: canPaste ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canPaste) {
                            handlePaste();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>粘贴</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL V</span>
                      </div>

                      {/* 复制 */}
                      <div
                        className={`menu-item ${!hasSelection ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: hasSelection ? '#333' : '#999',
                          opacity: hasSelection ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSelection) {
                            handleDuplicate();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>复制</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL D</span>
                      </div>

                      {/* 删除 */}
                      <div
                        className={`menu-item ${!hasSelection ? 'disabled' : ''}`}
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: hasSelection ? '#333' : '#999',
                          opacity: hasSelection ? 1 : 0.55,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSelection) {
                            handleDelete();
                            setIsEditMenuOpen(false);
                            setIsMoreMenuOpen(false);
                          }
                        }}
                      >
                        <span>删除</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>🗑️</span>
                      </div>

                      {/* 分隔线 */}
                      <div
                        style={{
                          height: '1px',
                          background: '#e1e1e1',
                          margin: '4px 0',
                        }}
                      ></div>

                      {/* 复制为 */}
                      <div style={{ position: 'relative' }}>
                        <div
                          className="menu-item"
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                            color: '#333',
                          }}
                          onMouseEnter={() => {
                            if (copyCloseTimerRef.current !== undefined) {
                              window.clearTimeout(copyCloseTimerRef.current);
                              copyCloseTimerRef.current = undefined;
                            }
                            setIsCopyAsOpen(true);
                          }}
                          onMouseLeave={() => {
                            copyCloseTimerRef.current = window.setTimeout(() => {
                              setIsCopyAsOpen(false);
                              copyCloseTimerRef.current = undefined;
                            }, 150);
                          }}
                        >
                          <span>复制为</span>
                          <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                        </div>
                        {isCopyAsOpen && (
                          <div
                            className="edit-submenu"
                            style={{
                              position: 'absolute',
                              left: '100%',
                              top: 0,
                              background: 'white',
                              border: '1px solid #e1e1e1',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 10002,
                              minWidth: `${SUBMENU_WIDTH}px`,
                              padding: '4px 0',
                            }}
                            onMouseEnter={() => {
                              if (copyCloseTimerRef.current !== undefined) {
                                window.clearTimeout(copyCloseTimerRef.current);
                                copyCloseTimerRef.current = undefined;
                              }
                              setIsCopyAsOpen(true);
                            }}
                            onMouseLeave={() => {
                              copyCloseTimerRef.current = window.setTimeout(() => {
                                setIsCopyAsOpen(false);
                                copyCloseTimerRef.current = undefined;
                              }, 150);
                            }}
                          >
                            <div
                              className="menu-item"
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '14px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAsSvg();
                                setIsCopyAsOpen(false);
                                setIsEditMenuOpen(false);
                                setIsMoreMenuOpen(false);
                              }}
                            >
                              <span>SVG</span>
                              <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL ↑ C</span>
                            </div>
                            <div
                              className="menu-item"
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '14px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAsPng();
                                setIsCopyAsOpen(false);
                                setIsEditMenuOpen(false);
                                setIsMoreMenuOpen(false);
                              }}
                            >
                              <span>PNG</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 导出为 */}
                      <div style={{ position: 'relative' }}>
                        <div
                          className="menu-item"
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                            color: '#333',
                          }}
                          onMouseEnter={() => {
                            if (exportCloseTimerRef.current !== undefined) {
                              window.clearTimeout(exportCloseTimerRef.current);
                              exportCloseTimerRef.current = undefined;
                            }
                            setIsExportAsOpen(true);
                          }}
                          onMouseLeave={() => {
                            exportCloseTimerRef.current = window.setTimeout(() => {
                              setIsExportAsOpen(false);
                              exportCloseTimerRef.current = undefined;
                            }, 150);
                          }}
                        >
                          <span>导出为</span>
                          <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                        </div>
                        {isExportAsOpen && (
                          <div
                            className="edit-submenu"
                            style={{
                              position: 'absolute',
                              left: '100%',
                              top: 0,
                              background: 'white',
                              border: '1px solid #e1e1e1',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 10002,
                              minWidth: `${SUBMENU_WIDTH}px`,
                              padding: '4px 0',
                            }}
                            onMouseEnter={() => {
                              if (exportCloseTimerRef.current !== undefined) {
                                window.clearTimeout(exportCloseTimerRef.current);
                                exportCloseTimerRef.current = undefined;
                              }
                              setIsExportAsOpen(true);
                            }}
                            onMouseLeave={() => {
                              exportCloseTimerRef.current = window.setTimeout(() => {
                                setIsExportAsOpen(false);
                                exportCloseTimerRef.current = undefined;
                              }, 150);
                            }}
                          >
                            <div
                              className="menu-item"
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '14px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportSvg();
                                setIsExportAsOpen(false);
                                setIsEditMenuOpen(false);
                                setIsMoreMenuOpen(false);
                              }}
                            >
                              <span>SVG</span>
                              <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL ↑ C</span>
                            </div>
                            <div
                              className="menu-item"
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '14px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportPng();
                                setIsExportAsOpen(false);
                                setIsEditMenuOpen(false);
                                setIsMoreMenuOpen(false);
                              }}
                            >
                              <span>PNG</span>
                            </div>
                            <div style={{ height: '1px', background: '#e1e1e1', margin: '4px 0' }} />
                            <div
                              className="menu-item"
                              style={{
                                padding: '8px 16px',
                                display: 'flex',
                                justifyContent: 'flex-start',
                                gap: 8,
                                fontSize: '14px',
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={transparentExport}
                                  onChange={(e) => setTransparentExport(e.target.checked)}
                                />
                                <span>透明</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 分隔线 */}
                      <div
                        style={{
                          height: '1px',
                          background: '#e1e1e1',
                          margin: '4px 0',
                        }}
                      ></div>

                      {/* 移除框架 */}
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#333',
                        }}
                      >
                        <span>移除框架</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL ↑ F</span>
                      </div>

                      {/* 展开 */}
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#333',
                        }}
                      >
                        <span>展开</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>↑ F</span>
                      </div>

                      {/* 分隔线 */}
                      <div
                        style={{
                          height: '1px',
                          background: '#e1e1e1',
                          margin: '4px 0',
                        }}
                      ></div>

                      {/* 锁定/解锁 */}
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#333',
                        }}
                      >
                        <span>锁定/解锁</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>↑ L</span>
                      </div>

                      {/* 全部解锁 */}
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#333',
                        }}
                      >
                        <span>全部解锁</span>
                      </div>

                      {/* 分隔线 */}
                      <div
                        style={{
                          height: '1px',
                          background: '#e1e1e1',
                          margin: '4px 0',
                        }}
                      ></div>

                      {/* 选中全部 */}
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#333',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                          setIsEditMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>选中全部</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL A</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 视图 */}
                <div style={{ position: 'relative' }}>
                  <div
                    className="menu-item"
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#333',
                    }}
                    onMouseEnter={() => setIsViewMenuOpen(true)}
                    onMouseLeave={() => setIsViewMenuOpen(false)}
                  >
                    <span>视图</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                  </div>
                  {isViewMenuOpen && (
                    <div
                      className="edit-submenu"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        background: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 10002,
                        minWidth: `${SUBMENU_WIDTH}px`,
                        padding: '4px 0',
                      }}
                      onMouseEnter={() => setIsViewMenuOpen(true)}
                      onMouseLeave={() => setIsViewMenuOpen(false)}
                    >
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomIn();
                          setIsViewMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>放大</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL =</span>
                      </div>
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomOut();
                          setIsViewMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>缩小</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL -</span>
                      </div>
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomTo100();
                          setIsViewMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>缩放至 100%</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>↑ 0</span>
                      </div>
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomToFit();
                          setIsViewMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>自适应缩放</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>↑ 1</span>
                      </div>
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomToSelection();
                          setIsViewMenuOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>缩放至显示选中内容</span>
                        <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>↑ 2</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 全部导出为 */}
                <div style={{ position: 'relative' }}>
                  <div
                    className="menu-item"
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#333',
                    }}
                    onMouseEnter={() => {
                      if (exportAllCloseTimerRef.current !== undefined) {
                        window.clearTimeout(exportAllCloseTimerRef.current);
                        exportAllCloseTimerRef.current = undefined;
                      }
                      setIsExportAllAsOpen(true);
                    }}
                    onMouseLeave={() => {
                      exportAllCloseTimerRef.current = window.setTimeout(() => {
                        setIsExportAllAsOpen(false);
                        exportAllCloseTimerRef.current = undefined;
                      }, 150);
                    }}
                  >
                    <span>全部导出为</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                  </div>
                  {isExportAllAsOpen && (
                    <div
                      className="edit-submenu"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        background: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10002,
                        minWidth: `${SUBMENU_WIDTH}px`,
                        padding: '4px 0',
                      }}
                      onMouseEnter={() => {
                        if (exportAllCloseTimerRef.current !== undefined) {
                          window.clearTimeout(exportAllCloseTimerRef.current);
                          exportAllCloseTimerRef.current = undefined;
                        }
                        setIsExportAllAsOpen(true);
                      }}
                      onMouseLeave={() => {
                        exportAllCloseTimerRef.current = window.setTimeout(() => {
                          setIsExportAllAsOpen(false);
                          exportAllCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                    >
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const allPages = editor.getPages?.() || [];
                            allPages.forEach((p: any) => exportWholePageAsSvg(p.id, p.name));
                          } catch {}
                          setIsExportAllAsOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>SVG</span>
                      </div>
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const allPages = editor.getPages?.() || [];
                            allPages.forEach((p: any) => exportWholePageAsPng(p.id, p.name));
                          } catch {}
                          setIsExportAllAsOpen(false);
                          setIsMoreMenuOpen(false);
                        }}
                      >
                        <span>PNG</span>
                      </div>
                      <div style={{ height: '1px', background: '#e1e1e1', margin: '4px 0' }} />
                      <div
                        className="menu-item"
                        style={{
                          padding: '8px 16px',
                          display: 'flex',
                          justifyContent: 'flex-start',
                          gap: 8,
                          fontSize: '14px',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={transparentExport}
                            onChange={(e) => setTransparentExport(e.target.checked)}
                          />
                          <span>透明</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 创建嵌入 */}
                <div
                  className="menu-item"
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: '#333',
                  }}
                >
                  <span>创建嵌入</span>
                  <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL I</span>
                </div>

                {/* 上传媒体文件 */}
                <div
                  className="menu-item"
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    color: '#333',
                  }}
                >
                  <span>上传媒体文件</span>
                  <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>CTRL U</span>
                </div>

                {/* 分隔线 */}
                <div
                  style={{
                    height: '1px',
                    background: '#e1e1e1',
                    margin: '4px 0',
                  }}
                ></div>

                {/* 偏好 */}
                <div
                  style={{ position: 'relative' }}
                  onMouseLeave={(e) => {
                    // 只有当真正离开父容器且未进入子菜单时才关闭
                    const related = (e as any).relatedTarget as Node | null;
                    const container = e.currentTarget as HTMLElement;
                    if (!related || !container.contains(related)) {
                      prefsCloseTimerRef.current = window.setTimeout(() => {
                        setIsPrefsMenuOpen(false);
                        prefsCloseTimerRef.current = undefined;
                      }, 150);
                    }
                  }}
                >
                  <div
                    className="menu-item"
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#333',
                    }}
                    onMouseEnter={() => {
                      if (prefsCloseTimerRef.current !== undefined) {
                        window.clearTimeout(prefsCloseTimerRef.current);
                        prefsCloseTimerRef.current = undefined;
                      }
                      setIsPrefsMenuOpen(true);
                    }}
                  >
                    <span>偏好</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                  </div>
                  {isPrefsMenuOpen && (
                    <div
                      className="edit-submenu"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        background: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 10002,
                        minWidth: `${SUBMENU_WIDTH}px`,
                        padding: '4px 0',
                      }}
                      onMouseEnter={() => {
                        if (prefsCloseTimerRef.current !== undefined) {
                          window.clearTimeout(prefsCloseTimerRef.current);
                          prefsCloseTimerRef.current = undefined;
                        }
                        refreshPrefsState();
                        setIsPrefsMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        prefsCloseTimerRef.current = window.setTimeout(() => {
                          setIsPrefsMenuOpen(false);
                          prefsCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                    >
                      {[
                        { key: 'isSnapMode', label: '始终吸附' },
                        { key: 'isToolLocked', label: '工具锁定', hint: 'Q' },
                        { key: 'isGridMode', label: '显示网格', hint: "CTRL '" },
                        { key: 'isWrapSelection', label: '选择焊行' },
                        { key: 'isFocusMode', label: '专注模式', hint: 'CTRL .' },
                        // 兼容字段：仅当实例存在对应键时才显示
                        ...(() => {
                          const inst = (editor as any)?.getInstanceState?.() || {};
                          const items: any[] = [];
                          if (Object.prototype.hasOwnProperty.call(inst, 'isEdgeScrolling'))
                            items.push({ key: 'isEdgeScrolling', label: '边缘滚动' });
                          if (Object.prototype.hasOwnProperty.call(inst, 'isReducedMotion'))
                            items.push({ key: 'isReducedMotion', label: '降低眩晕度' });
                          if (Object.prototype.hasOwnProperty.call(inst, 'isDynamicSizeMode'))
                            items.push({ key: 'isDynamicSizeMode', label: '动态尺寸' });
                          if (Object.prototype.hasOwnProperty.call(inst, 'isPasteAtCursor'))
                            items.push({ key: 'isPasteAtCursor', label: '粘贴至光标处' });
                          if (Object.prototype.hasOwnProperty.call(inst, 'isDebugMode'))
                            items.push({ key: 'isDebugMode', label: '调试模式' });
                          return items;
                        })(),
                      ].map((item: any, idx: number) => (
                        <div
                          key={item.key}
                          className="menu-item"
                          style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePref(item.key as any);
                          }}
                        >
                          <span style={{ width: 28, display: 'inline-flex', alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(prefsState[item.key as keyof typeof prefsState])}
                              readOnly
                            />
                          </span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.hint && (
                            <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                              {item.hint}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 语言 */}
                <div
                  style={{ position: 'relative' }}
                  onMouseLeave={(e) => {
                    const related = (e as any).relatedTarget as Node | null;
                    const container = e.currentTarget as HTMLElement;
                    if (!related || !container.contains(related)) {
                      langCloseTimerRef.current = window.setTimeout(() => {
                        setIsLangMenuOpen(false);
                        langCloseTimerRef.current = undefined;
                      }, 150);
                    }
                  }}
                >
                  <div
                    className="menu-item"
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      color: '#333',
                    }}
                    onMouseEnter={() => {
                      if (langCloseTimerRef.current !== undefined) {
                        window.clearTimeout(langCloseTimerRef.current);
                        langCloseTimerRef.current = undefined;
                      }
                      setIsLangMenuOpen(true);
                    }}
                  >
                    <span>语言</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>›</span>
                  </div>
                  {isLangMenuOpen && (
                    <div
                      className="edit-submenu"
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        background: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10002,
                        minWidth: `${SUBMENU_WIDTH}px`,
                        padding: '4px 0',
                        maxHeight: '260px',
                        overflowY: 'auto',
                      }}
                      onMouseEnter={() => {
                        if (langCloseTimerRef.current !== undefined) {
                          window.clearTimeout(langCloseTimerRef.current);
                          langCloseTimerRef.current = undefined;
                        }
                        setIsLangMenuOpen(true);
                      }}
                    >
                      {supportedLocales.map((loc) => {
                        const current = getCurrentLocale();
                        const active = current === loc.code;
                        return (
                          <div
                            key={loc.code}
                            className="menu-item"
                            style={{
                              padding: '8px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '14px',
                              cursor: 'pointer',
                              background: active ? '#f4f7ff' : 'transparent',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                (editor as any).user?.updateUserPreferences?.({ locale: loc.code });
                              } catch {}
                              setIsLangMenuOpen(false);
                              setIsMoreMenuOpen(false);
                            }}
                          >
                            <span style={{ width: 18 }}>{active ? '✓' : ''}</span>
                            <span style={{ flex: 1 }}>{loc.label}</span>
                            <span style={{ color: '#999' }}>{loc.code}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 顶部快捷按钮：撤销 / 取消撤销 / 删除 / 复制（重复） */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* <button
            className="top-button"
            style={{
              width: '32px', height: '32px', border: '1px solid #e5e7eb',
              background: canUndo ? '#fff' : '#f9fafb',
              borderRadius: '6px', cursor: canUndo ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: canUndo ? '#111' : '#9ca3af',
              opacity: canUndo ? 1 : 0.45
            }}
            title="撤销 (Ctrl+Z)"
            onClick={() => { handleUndo(); }}
            onMouseEnter={(e) => { if (canUndo) { e.currentTarget.style.background = '#f3f4f6'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            disabled={!canUndo}
          >
            <Undo2 size={16} />
          </button>

          <button
            className="top-button"
            style={{
              width: '32px', height: '32px', border: '1px solid #e5e7eb',
              background: canRedo ? '#fff' : '#f9fafb',
              borderRadius: '6px', cursor: canRedo ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: canRedo ? '#111' : '#9ca3af',
              opacity: canRedo ? 1 : 0.45
            }}
            title="取消撤销 (Ctrl+Shift+Z)"
            onClick={() => { handleRedo(); }}
            onMouseEnter={(e) => { if (canRedo) { e.currentTarget.style.background = '#f3f4f6'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            disabled={!canRedo}
          >
            <Redo2 size={16} />
          </button>

          <button
            className="top-button"
            style={{
              width: '32px', height: '32px', border: '1px solid #e5e7eb',
              background: hasSelection ? '#fff' : '#f9fafb',
              borderRadius: '6px', cursor: hasSelection ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: hasSelection ? '#111' : '#9ca3af',
              opacity: hasSelection ? 1 : 0.45
            }}
            title="删除 (Delete)"
            onClick={() => { if (hasSelection) handleDelete(); }}
            onMouseEnter={(e) => { if (hasSelection) { e.currentTarget.style.background = '#f3f4f6'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            disabled={!hasSelection}
          >
            <Trash2 size={16} />
          </button>

          <button
            className="top-button"
            style={{
              width: '32px', height: '32px', border: '1px solid #e5e7eb',
              background: hasSelection ? '#fff' : '#f9fafb',
              borderRadius: '6px', cursor: hasSelection ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: hasSelection ? '#111' : '#9ca3af',
              opacity: hasSelection ? 1 : 0.45
            }}
            title="复制（重复）(Ctrl+D)"
            onClick={() => { if (hasSelection) handleDuplicate(); }}
            onMouseEnter={(e) => { if (hasSelection) { e.currentTarget.style.background = '#f3f4f6'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            disabled={!hasSelection}
          >
            <Copy size={16} />
          </button> */}
          </div>
          {/* 布局切换按钮（最右侧） */}
          <button
            className="top-button layout-toggle"
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111',
            }}
            title={isLeftBodyCollapsed ? '展开布局' : '隐藏布局'}
            onClick={() => {
              const next = !isLeftBodyCollapsed;
              setIsLeftBodyCollapsed(next);
              window.dispatchEvent(new CustomEvent('vines:toggle-right-sidebar', { detail: { visible: !next } }));
              window.dispatchEvent(new CustomEvent('vines:toggle-left-sidebar-body', { detail: { collapsed: next } }));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2" stroke="#111" strokeWidth="1.5" />
              <line x1="10" y1="5" x2="10" y2="19" stroke="#111" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 当 agentVisible 时，显示 Agent 嵌入；其次是 mini 应用；否则显示页面+图层面板 */}
      {/* TODO: Re-enable when agent hooks are available
      {agentVisible && !isLeftBodyCollapsed ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
          <TldrawAgentV2EmbeddedPanel editor={editor} boardId={boardId} onClose={() => setAgentVisible(false)} />
        </div>
      ) : */}
      {miniPage && !isLeftBodyCollapsed ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', position: 'relative' }}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: historyOpen ? 'hidden' : 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: historyOpen ? '0px' : '50px',
            }}
          >
            {/* 迷你应用顶部信息栏：显示当前工作流名称与描述 */}
            <div
              style={{
                flexShrink: 0,
                zIndex: 1,
                background: '#fff',
                padding: '10px 12px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {(() => {
                  const title =
                    normalizeText(miniPage?.workflow?.displayName) ||
                    normalizeText(miniPage?.workflow?.name) ||
                    normalizeText(miniPage?.name) ||
                    '未命名工作流';
                  const desc = normalizeText(miniPage?.workflow?.description);
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        columnGap: 10,
                        rowGap: 0,
                        alignItems: 'center',
                        minWidth: 0,
                      }}
                    >
                      {/* 行1：图标（包裹底板） + 名称 */}
                      <div
                        style={{
                          gridColumn: '1 / 2',
                          gridRow: '1 / 2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#f2f4f7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                          }}
                        >
                          <VinesIcon size="sm" className="pointer-events-none select-none" disabledPreview>
                            {miniPage?.workflow?.iconUrl || DEFAULT_WORKFLOW_ICON_URL}
                          </VinesIcon>
                        </div>
                      </div>
                      <div
                        style={{
                          gridColumn: '2 / 3',
                          gridRow: '1 / 2',
                          minWidth: 0,
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#2b2f36',
                          lineHeight: '20px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {title}
                      </div>
                      {/* 行2：对齐到名称左边，展示描述（带小图标，标签样式） */}
                      <div
                        style={{
                          gridColumn: '2 / 3',
                          gridRow: '2 / 3',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#6b7280',
                          minWidth: 0,
                          marginTop: -2,
                        }}
                      >
                        {desc ? (
                          <>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0',
                                maxWidth: '100%',
                              }}
                            >
                              <VinesLucideIcon
                                className="size-3"
                                size={12}
                                src={
                                  EMOJI2LUCIDE_MAPPER[miniPage?.instance?.icon] ??
                                  (miniPage?.instance?.icon || 'lucide:file-text')
                                }
                              />
                              <div
                                style={{
                                  fontSize: 12,
                                  lineHeight: '16px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {desc}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
                <button
                  title={historyOpen ? '返回' : '显示历史'}
                  onClick={() => setHistoryOpen(!historyOpen)}
                  style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '0 8px',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  {historyOpen ? <ArrowLeft size={14} color="#6b7280" /> : <History size={14} color="#6b7280" />}
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{historyOpen ? '返回' : '历史记录'}</span>
                </button>
              </div>
            </div>
            {!historyOpen && (
              <div
                style={{
                  transform: 'scale(0.9)',
                  transformOrigin: 'top left',
                  width: '111.111111%',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <VinesFlowProvider workflowId={miniPage?.workflowId || miniPage?.workflow?.id || ''}>
                  <FlowStoreProvider createStore={createFlowStore}>
                    <CanvasStoreProvider createStore={createCanvasStore}>
                      <VinesViewWrapper workflowId={miniPage?.workflowId || miniPage?.workflow?.id}>
                        <ExecutionStoreProvider createStore={createExecutionStore}>
                          <VinesTabular
                            className="h-full w-full"
                            event$={miniEvent$}
                            height={'100%'}
                            onTabularEventCreated={(event$) => {
                              (window as any).tabularEventRef = event$;
                            }}
                            showButtons={false}
                            appInfo={{
                              appName:
                                normalizeText(miniPage?.workflow?.displayName) ||
                                normalizeText(miniPage?.workflow?.name) ||
                                normalizeText(miniPage?.name) ||
                                '未命名应用',
                              appIcon: miniPage?.workflow?.iconUrl || DEFAULT_WORKFLOW_ICON_URL,
                            }}
                          />
                        </ExecutionStoreProvider>
                      </VinesViewWrapper>
                    </CanvasStoreProvider>
                  </FlowStoreProvider>
                </VinesFlowProvider>
              </div>
            )}
            {historyOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: '#6b7280', padding: '12px 12px 8px 12px', flexShrink: 0 }}>
                  历史记录
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    columnCount: 2,
                    columnGap: 8,
                    padding: '0 12px 8px 12px',
                    minHeight: 0,
                  }}
                >
                  {(() => {
                    try {
                      const items = newConvertExecutionResultToItemList(allOutputsPages ?? []);
                      const workflowId = miniPage?.workflowId || miniPage?.workflow?.id;
                      // 过滤出对应工作流且成功完成的项目（排除失败、超时、取消等状态）
                      const allItems = items.filter((it: any) => {
                        const isSameWorkflow = it?.workflowId === workflowId;
                        const isSuccess = it?.status === 'COMPLETED';
                        return isSameWorkflow && isSuccess;
                      });
                      const totalPages = Math.ceil(allItems.length / historyPageSize);
                      const startIndex = (historyPage - 1) * historyPageSize;
                      const endIndex = startIndex + historyPageSize;
                      const list = allItems.slice(startIndex, endIndex);

                      let waitingList = (pendingHistory || []).filter((p) => p.workflowId === workflowId);
                      if (list.length === 0 && waitingList.length === 0)
                        return <div style={{ columnSpan: 'all', color: '#9ca3af', fontSize: 12 }}>暂无历史</div>;

                      // 辅助函数：判断是否是图片URL
                      const isImageUrl = (str: string): boolean => {
                        if (!str || typeof str !== 'string') return false;
                        // 检查是否是URL格式
                        try {
                          const url = new URL(str);
                          // 检查文件扩展名
                          const ext = url.pathname.toLowerCase().split('.').pop();
                          return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
                        } catch {
                          // 如果不是有效URL，检查是否是base64图片
                          return str.startsWith('data:image/');
                        }
                      };

                      // 辅助函数：提取显示内容（只返回图片或包含outputtext的文本，其他返回null）
                      const extractDisplayContent = (data: any): { type: 'image' | 'text'; content: string } | null => {
                        // 如果是字符串，检查是否是图片URL
                        if (typeof data === 'string') {
                          if (isImageUrl(data)) {
                            return { type: 'image', content: data };
                          }
                          // 尝试解析JSON字符串
                          try {
                            const parsed = JSON.parse(data);
                            if (parsed && typeof parsed === 'object' && parsed.outputtext) {
                              return { type: 'text', content: String(parsed.outputtext) };
                            }
                          } catch {
                            // 不是JSON，也不是图片，过滤掉
                            return null;
                          }
                          // 不符合条件，过滤掉
                          return null;
                        }

                        // 如果是对象
                        if (data && typeof data === 'object') {
                          // 检查是否有 outputtext 键
                          if (data.outputtext) {
                            return { type: 'text', content: String(data.outputtext) };
                          }
                          // 检查是否有图片URL字段
                          for (const key of ['url', 'imageUrl', 'image', 'src']) {
                            if (data[key] && typeof data[key] === 'string' && isImageUrl(data[key])) {
                              return { type: 'image', content: data[key] };
                            }
                          }
                          // 不符合条件，过滤掉
                          return null;
                        }

                        return null;
                      };

                      const waitingNodes = waitingList.map((p, idx) => {
                        const timeStr = formatTime(p.time);
                        // 如果已有渲染数据，则按完成卡片渲染（乐观更新）
                        if (p.renderData) {
                          const displayContent = extractDisplayContent(p.renderData);
                          if (displayContent?.type === 'image') {
                            return (
                              <div
                                key={`pending-${p.instanceId}-${idx}`}
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 8,
                                  marginBottom: 8,
                                  breakInside: 'avoid',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                              >
                                <img
                                  src={displayContent.content}
                                  style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                                  alt="历史记录"
                                />
                                {timeStr && (
                                  <div
                                    style={{
                                      padding: '6px 8px',
                                      fontSize: 10,
                                      color: '#9ca3af',
                                      backgroundColor: '#f9fafb',
                                      textAlign: 'center',
                                      borderTop: '1px solid #e5e7eb',
                                    }}
                                  >
                                    {timeStr}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          if (displayContent?.type === 'text') {
                            return (
                              <div
                                key={`pending-${p.instanceId}-${idx}`}
                                style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 8,
                                  marginBottom: 8,
                                  breakInside: 'avoid',
                                  display: 'inline-block',
                                  width: '100%',
                                  overflow: 'hidden',
                                }}
                              >
                                <div style={{ padding: 8, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>
                                  <pre
                                    style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                  >
                                    {displayContent.content}
                                  </pre>
                                </div>
                                {timeStr && (
                                  <div
                                    style={{
                                      padding: '6px 8px',
                                      fontSize: 10,
                                      color: '#9ca3af',
                                      backgroundColor: '#f9fafb',
                                      textAlign: 'center',
                                      borderTop: '1px solid #e5e7eb',
                                    }}
                                  >
                                    {timeStr}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        }
                        // 默认等待态
                        return (
                          <div
                            key={`pending-${p.instanceId}-${idx}`}
                            className="mini-history-waiting"
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              marginBottom: 8,
                              breakInside: 'avoid',
                              display: 'flex',
                              flexDirection: 'column',
                              width: '100%',
                              overflow: 'hidden',
                              background: '#fff',
                              aspectRatio: '1 / 1',
                              minHeight: 160,
                            }}
                          >
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div className="spinner" />
                            </div>
                            {timeStr && (
                              <div
                                style={{
                                  padding: '6px 8px',
                                  fontSize: 10,
                                  color: '#9ca3af',
                                  backgroundColor: '#f9fafb',
                                  textAlign: 'center',
                                  borderTop: '1px solid #e5e7eb',
                                }}
                              >
                                {timeStr}
                              </div>
                            )}
                          </div>
                        );
                      });

                      // 若某个 instanceId 已经出现在完成列表里，则不再渲染其等待项（避免重复）
                      const doneInstanceSet = new Set<string>(
                        (list || []).map((it: any) => String(it?.instanceId || '')),
                      );
                      waitingList = waitingList.filter((p) => !doneInstanceSet.has(String(p.instanceId)));

                      const doneNodes = list
                        .map((it: any, idx: number) => {
                          const data = it?.render?.data;
                          const displayContent = extractDisplayContent(data);

                          if (!displayContent) return null;

                          // 格式化时间
                          const formatTime = (timestamp: number | string | undefined) => {
                            if (!timestamp) return '';
                            // 处理时间戳，可能是字符串或数字，可能不是毫秒
                            let ts = timestamp;
                            if (typeof ts === 'string') {
                              ts = parseInt(ts, 10);
                              if (isNaN(ts)) return '';
                            }
                            // 如果是秒级时间戳（小于13位），转换为毫秒
                            if (ts < 1e12) {
                              ts = ts * 1000;
                            }
                            const date = new Date(ts);
                            if (isNaN(date.getTime())) return '';
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                          };

                          const timeStr = formatTime(it?.endTime || it?.createTime || it?.startTime);

                          // 显示图片
                          if (displayContent.type === 'image') {
                            return (
                              <div
                                key={idx}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', displayContent.content);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 8,
                                  cursor: 'grab',
                                  marginBottom: 8,
                                  breakInside: 'avoid',
                                  display: 'inline-block',
                                  width: '100%',
                                }}
                                onMouseDown={(e) => {
                                  e.currentTarget.style.cursor = 'grabbing';
                                }}
                                onMouseUp={(e) => {
                                  e.currentTarget.style.cursor = 'grab';
                                }}
                              >
                                {/* 图片等比例缩放，保持宽高比 */}
                                <img
                                  src={displayContent.content}
                                  style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                                  alt="历史记录"
                                />
                                {/* 时间标签 */}
                                {timeStr && (
                                  <div
                                    style={{
                                      padding: '6px 8px',
                                      fontSize: 10,
                                      color: '#9ca3af',
                                      backgroundColor: '#f9fafb',
                                      textAlign: 'center',
                                      borderTop: '1px solid #e5e7eb',
                                    }}
                                  >
                                    {timeStr}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // 显示文本
                          return (
                            <div
                              key={idx}
                              style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                marginBottom: 8,
                                breakInside: 'avoid',
                                display: 'inline-block',
                                width: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  padding: 8,
                                  fontSize: 12,
                                  maxHeight: 120,
                                  overflow: 'auto',
                                }}
                              >
                                <pre
                                  style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                >
                                  {displayContent.content}
                                </pre>
                              </div>
                              {/* 时间标签 */}
                              {timeStr && (
                                <div
                                  style={{
                                    padding: '6px 8px',
                                    fontSize: 10,
                                    color: '#9ca3af',
                                    backgroundColor: '#f9fafb',
                                    textAlign: 'center',
                                    borderTop: '1px solid #e5e7eb',
                                  }}
                                >
                                  {timeStr}
                                </div>
                              )}
                            </div>
                          );
                        })
                        .filter(Boolean);

                      return [...waitingNodes, ...doneNodes];
                    } catch {
                      return <div style={{ columnSpan: 'all', color: '#9ca3af', fontSize: 12 }}>历史加载失败</div>;
                    }
                  })()}
                </div>
                {(() => {
                  try {
                    const items = newConvertExecutionResultToItemList(allOutputsPages ?? []);
                    const workflowId = miniPage?.workflowId || miniPage?.workflow?.id;
                    // 过滤出对应工作流且成功完成的项目（排除失败、超时、取消等状态）
                    const allItems = items.filter((it: any) => {
                      const isSameWorkflow = it?.workflowId === workflowId;
                      const isSuccess = it?.status === 'COMPLETED';
                      return isSameWorkflow && isSuccess;
                    });
                    const totalPages = Math.ceil(allItems.length / historyPageSize);

                    if (totalPages <= 1) return null;

                    return (
                      <div
                        style={{
                          padding: '8px 12px 12px 12px',
                          borderTop: '1px solid #e5e7eb',
                          width: '100%',
                          flexShrink: 0,
                          backgroundColor: '#fff',
                          borderBottomLeftRadius: '20px',
                          borderBottomRightRadius: '20px',
                        }}
                      >
                        <Pagination
                          className="w-full"
                          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        >
                          <PaginationContent
                            className="w-full"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                          >
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                                style={{
                                  cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
                                  opacity: historyPage === 1 ? 0.5 : 1,
                                }}
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setHistoryPage(Math.min(totalPages, historyPage + 1))}
                                style={{
                                  cursor: historyPage === totalPages ? 'not-allowed' : 'pointer',
                                  opacity: historyPage === totalPages ? 0.5 : 1,
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            )}
          </div>
          {/* 固定在底部的区域 - 包含按钮（仅在没有打开历史记录时显示） */}
          {!historyOpen && <MiniTabularButtonsWrapper miniPage={miniPage} useAbsolutePosition={true} />}
        </div>
      ) : (
        <>
          {/* 页面列表部分 - 可调节高度（可折叠） */}
          {!isLeftBodyCollapsed && (
            <div
              className="pages-section"
              style={{
                height: isPageSectionCollapsed ? 'auto' : `${pagesSectionHeight}px`,
                flexShrink: 0,
                flexDirection: 'column',
                minHeight: isPageSectionCollapsed ? 'auto' : '100px',
                maxHeight: isPageSectionCollapsed
                  ? 'auto'
                  : `${totalAvailableHeight > 0 ? totalAvailableHeight - 150 : 400}px`,
                overflow: 'hidden',
              }}
            >
              {/* 页面标题栏 - 带按钮 */}
              <div
                className="layer-panel-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  position: 'relative',
                  flexShrink: 0, // 防止标题栏被压缩
                  height: '50px', // 固定高度
                  boxSizing: 'border-box',
                }}
              >
                <span>页面</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* 搜索按钮 */}
                  <button
                    onClick={() => {
                      setIsSearchVisible(!isSearchVisible);
                      if (!isSearchVisible) {
                        // 延迟聚焦，确保输入框已经显示
                        setTimeout(() => {
                          const searchInput = document.querySelector('.page-search-input') as HTMLInputElement;
                          if (searchInput) {
                            searchInput.focus();
                          }
                        }, 10);
                      }
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '3px',
                      fontSize: '12px',
                    }}
                    title="搜索页面"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    🔍
                  </button>

                  {/* 添加页面按钮 */}
                  <button
                    onClick={handleAddPage}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '3px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                    title="添加新页面"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    +
                  </button>

                  {/* 收起/展开按钮 */}
                  <button
                    onClick={handleTogglePageSection}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '3px',
                      fontSize: '10px',
                    }}
                    title={isPageSectionCollapsed ? '展开页面列表' : '收起页面列表'}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {isPageSectionCollapsed ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              {/* 搜索输入框 */}
              <input
                className="page-search-input"
                type="text"
                placeholder="搜索页面..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  display: isSearchVisible ? 'block' : 'none',
                  margin: '0 12px 8px 12px',
                  padding: '4px 8px',
                  border: '1px solid #e1e1e1',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none',
                  flexShrink: 0, // 防止被压缩
                  height: '28px', // 固定高度
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e1e1e1')}
              />

              {/* 页面列表 */}
              {!isPageSectionCollapsed && (
                <div
                  className="pages-list"
                  style={{
                    height: `${pagesSectionHeight - 50 - (isSearchVisible ? 36 : 0)}px`, // 计算实际可用高度：总高度 - 标题栏 - 搜索框（如果显示）
                    overflow: 'auto',
                  }}
                >
                  {filteredPages.length > 0 ? (
                    filteredPages.map((page) => (
                      <PageItem key={page.id} pageId={page.id} editor={editor} isActive={page.id === currentPageId} />
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      {searchQuery ? '未找到匹配的页面' : '暂无页面'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 拖拽手柄 - 只在页面区域展开时显示（折叠时隐藏） */}
          {!isPageSectionCollapsed && !isLeftBodyCollapsed && (
            <div
              className="resize-handle"
              onMouseDown={handleDragStart}
              style={{
                height: '8px',
                backgroundColor: isDragging ? '#2563eb' : '#f1f5f9',
                cursor: 'row-resize',
                position: 'relative',
                flexShrink: 0,
                transition: isDragging ? 'none' : 'background-color 0.2s',
                borderTop: '1px solid #e1e1e1',
                borderBottom: '1px solid #e1e1e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
            >
              {/* 拖拽手柄指示器 */}
              <div
                style={{
                  width: '30px',
                  height: '2px',
                  backgroundColor: isDragging ? 'white' : '#94a3b8',
                  borderRadius: '1px',
                  transition: isDragging ? 'none' : 'background-color 0.2s',
                }}
              />
            </div>
          )}

          {/* 图层列表部分 - 动态高度（可折叠） */}
          {!isLeftBodyCollapsed && (
            <div
              className="shapes-section"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0, // 确保可以正确收缩
                overflow: 'hidden',
              }}
            >
              <div className="layer-panel-title">图层</div>
              <div className="shape-tree" style={{ flex: 1, overflow: 'auto' }}>
                {currentPageShapeIds.map((shapeId) => (
                  <ShapeItem key={shapeId} shapeId={shapeId} editor={editor} depth={0} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
