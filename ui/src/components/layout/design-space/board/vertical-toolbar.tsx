import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import type { IPinPage } from '@/apis/pages/typings.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';
import { GeoShapeGeoStyle } from '@tldraw/editor';
import { useEffect, useRef, useState } from 'react';
import { TLComponents, TldrawUiIcon, useEditor } from 'tldraw';
import './vertical-toolbar.scss';

// 自定义竖向工具栏组件
export const VerticalToolbar: TLComponents['Toolbar'] = () => {
  const editor = useEditor();
  const { data: oem } = useSystemConfig();
  const [currentToolId, setCurrentToolId] = useState(editor.getCurrentToolId());
  const [isDrawMenuOpen, setIsDrawMenuOpen] = useState(false);
  const [drawVariant, setDrawVariant] = useState<'draw' | 'highlight' | 'laser'>('draw');
  const drawGroupRef = useRef<HTMLDivElement | null>(null);
  const drawCloseTimerRef = useRef<number | undefined>(undefined);
  const [isGeoMenuOpen, setIsGeoMenuOpen] = useState(false);
  const [geoVariant, setGeoVariant] = useState<(typeof GeoShapeGeoStyle.values extends Iterable<infer T> ? T : never) | 'rectangle'>('rectangle');
  const geoGroupRef = useRef<HTMLDivElement | null>(null);
  const geoCloseTimerRef = useRef<number | undefined>(undefined);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusGroupRef = useRef<HTMLDivElement | null>(null);
  const plusCloseTimerRef = useRef<number | undefined>(undefined);
  // 工作台被 pin 的应用
  const { data: pinnedPages } = useWorkspacePages();
  // 选中的快速应用（展示在 Plus 工具栏下方）
  const [quickPinned, setQuickPinned] = useState<IPinPage[]>([]);

  // 提取应用图标
  const getPageIcon = (page: IPinPage): string | undefined => {
    return (
      (page as any)?.designProject?.iconUrl ||
      (page as any)?.workflow?.iconUrl ||
      (page as any)?.agent?.iconUrl ||
      (page as any)?.instance?.icon ||
      undefined
    );
  };
  
  // 检查是否显示 sidebar
  const showPageAndLayerSidebar = oem?.theme?.designProjects?.showPageAndLayerSidebar || false;
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  useEffect(() => {
    const handler = (e: any) => setLeftCollapsed(Boolean(e?.detail?.collapsed));
    window.addEventListener('vines:toggle-left-sidebar-body', handler as any);
    return () => window.removeEventListener('vines:toggle-left-sidebar-body', handler as any);
  }, []);
  // mini 开关状态（不影响 toolbar 定位，仅用于样式或激活态）
  const [miniActive, setMiniActive] = useState(false);
  const [currentMiniPageId, setCurrentMiniPageId] = useState<string | null>(null);
  useEffect(() => {
    const onMini = (e: any) => {
      const pid = e?.detail?.pageId ?? null;
      setMiniActive(Boolean(pid));
      setCurrentMiniPageId(pid);
    };
    window.addEventListener('vines:mini-state', onMini as any);
    return () => window.removeEventListener('vines:mini-state', onMini as any);
  }, []);
  // 工具栏位置：跟随左侧栏实际宽度
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(300);
  useEffect(() => {
    const handler = (e: any) => {
      const w = Number(e?.detail?.width);
      if (!Number.isNaN(w)) setLeftSidebarWidth(w);
    };
    window.addEventListener('vines:left-sidebar-width-change', handler as any);
    return () => window.removeEventListener('vines:left-sidebar-width-change', handler as any);
  }, []);
  // 工具栏位置：
  // - 侧栏展开：始终在 sidebar 右边 10px（左边距10 + 宽度 + 10）
  // - 侧栏收起：回到最左边 16px
  const toolbarLeft = showPageAndLayerSidebar
    ? (leftCollapsed ? '16px' : `${leftSidebarWidth + 20}px`)
    : '16px';
  
  // 监听工具变化
  useEffect(() => {
    const handleToolChange = () => {
      setCurrentToolId(editor.getCurrentToolId());
    };
    
    editor.addListener('change', handleToolChange);
    
    return () => {
      editor.removeListener('change', handleToolChange);
    };
  }, [editor]);

  // 点击外部关闭下拉
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isDrawMenuOpen) {
        if (drawGroupRef.current && !drawGroupRef.current.contains(target)) {
          setIsDrawMenuOpen(false);
        }
      }
      if (isGeoMenuOpen) {
        if (geoGroupRef.current && !geoGroupRef.current.contains(target)) {
          setIsGeoMenuOpen(false);
        }
      }
      if (isPlusMenuOpen) {
        if (plusGroupRef.current && !plusGroupRef.current.contains(target)) {
          setIsPlusMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isDrawMenuOpen, isGeoMenuOpen, isPlusMenuOpen]);
  
  // 定义工具栏中要显示的工具列表 - 使用正确的工具ID
  const oneOnOne = (oem as any)?.theme?.designProjects?.oneOnOne === true;
  const toolbarTools = [
    { id: 'select', label: 'Select', icon: 'tool-pointer' },
    { id: 'hand', label: 'Hand', icon: 'tool-hand' },
    ...(!oneOnOne ? ([{ id: 'frame', label: 'Frame', icon: 'tool-frame' }]) : []),
    { id: 'shape', label: 'Shape', icon: 'geo-rectangle' },
    { id: 'draw', label: 'Draw', icon: 'tool-pencil' },
    { id: 'eraser', label: 'Eraser', icon: 'tool-eraser' },
    { id: 'text', label: 'Text', icon: 'tool-text' },
    { id: 'note', label: 'Note', icon: 'tool-note' },
  ];
  
  return (
    <div 
      className="vertical-toolbar"
      style={{ 
        position: 'fixed', 
        left: toolbarLeft, 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="custom-toolbar">
        {toolbarTools.map((tool) => {
          if (tool.id === 'shape') {
            const isActive = currentToolId === 'geo';
            const activeId = geoVariant;
            return (
              <div key="shape-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={geoGroupRef}>
                <button
                  className={`tool-button ${isActive ? 'selected' : ''} ${isGeoMenuOpen ? 'menu-open' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.run(() => {
                      editor.setStyleForNextShapes(GeoShapeGeoStyle, activeId as any);
                      editor.setCurrentTool('geo');
                      setCurrentToolId('geo');
                    });
                  }}
                  title={`Shape: ${String(activeId)}`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <TldrawUiIcon icon={`geo-${String(activeId)}` as any} />
                  <span className="caret" />
                  <span
                    className="caret-hit"
                    title="More shapes"
                    onMouseEnter={() => {
                      if (geoCloseTimerRef.current !== undefined) {
                        window.clearTimeout(geoCloseTimerRef.current);
                        geoCloseTimerRef.current = undefined;
                      }
                      setIsGeoMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      geoCloseTimerRef.current = window.setTimeout(() => {
                        setIsGeoMenuOpen(false);
                        geoCloseTimerRef.current = undefined;
                      }, 150);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsGeoMenuOpen((v) => !v);
                    }}
                  />
                </button>
                {isGeoMenuOpen && (
                  <div
                    className="dropdown-menu shapes-grid"
                    onMouseEnter={() => {
                      if (geoCloseTimerRef.current !== undefined) {
                        window.clearTimeout(geoCloseTimerRef.current);
                        geoCloseTimerRef.current = undefined;
                      }
                      setIsGeoMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      setIsGeoMenuOpen(false);
                    }}
                  >
                    {[...GeoShapeGeoStyle.values].map((id) => (
                      <div
                        key={String(id)}
                        className={`dropdown-item ${String(geoVariant) === String(id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setGeoVariant(id as any);
                          editor.run(() => {
                            editor.setStyleForNextShapes(GeoShapeGeoStyle, id as any);
                            editor.setCurrentTool('geo');
                          });
                          setCurrentToolId('geo');
                          setIsGeoMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon={`geo-${String(id)}` as any} />
                      </div>
                    ))}
                    {/* Extra tools in shapes menu: Arrow & Line */}
                    <div
                      className={`dropdown-item ${currentToolId === 'arrow' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editor.setCurrentTool('arrow');
                        setCurrentToolId('arrow');
                        setIsGeoMenuOpen(false);
                      }}
                    >
                      <TldrawUiIcon icon="tool-arrow" />
                    </div>
                    <div
                      className={`dropdown-item ${currentToolId === 'line' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editor.setCurrentTool('line');
                        setCurrentToolId('line');
                        setIsGeoMenuOpen(false);
                      }}
                    >
                      <TldrawUiIcon icon="tool-line" />
                    </div>
                  </div>
                )}
              </div>
            );
          }
          if (tool.id === 'draw') {
            const activeId = drawVariant;
            const isActive = currentToolId === 'draw' || currentToolId === 'highlight' || currentToolId === 'laser';
            return (
              <div key="draw-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={drawGroupRef}>
                <button
                  className={`tool-button ${isActive ? 'selected' : ''} ${isDrawMenuOpen ? 'menu-open' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.setCurrentTool(activeId);
                    setCurrentToolId(activeId);
                    setIsDrawMenuOpen(false);
                  }}
                  title={activeId === 'draw' ? 'Pen' : activeId === 'highlight' ? 'Highlight' : 'Laser'}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <TldrawUiIcon icon={activeId === 'draw' ? 'tool-pencil' : activeId === 'highlight' ? 'tool-highlight' : 'tool-laser'} />
                  <span className="caret" />
                  <span
                    className="caret-hit"
                    title="More pens"
                    onMouseEnter={() => {
                      if (drawCloseTimerRef.current !== undefined) {
                        window.clearTimeout(drawCloseTimerRef.current);
                        drawCloseTimerRef.current = undefined;
                      }
                      setIsDrawMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      drawCloseTimerRef.current = window.setTimeout(() => {
                        setIsDrawMenuOpen(false);
                        drawCloseTimerRef.current = undefined;
                      }, 150);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDrawMenuOpen((v) => !v);
                    }}
                  />
                </button>
                {isDrawMenuOpen && (
                  <div
                    className="dropdown-menu"
                    onMouseEnter={() => {
                      if (drawCloseTimerRef.current !== undefined) {
                        window.clearTimeout(drawCloseTimerRef.current);
                        drawCloseTimerRef.current = undefined;
                      }
                      setIsDrawMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                      setIsDrawMenuOpen(false);
                    }}
                  >
                    <div
                      className={`dropdown-item ${drawVariant === 'draw' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDrawVariant('draw');
                        editor.setCurrentTool('draw');
                        setCurrentToolId('draw');
                        setIsDrawMenuOpen(false);
                      }}
                    >
                      <TldrawUiIcon icon="tool-pencil" />
                      <span>Pen</span>
                    </div>
                    <div
                      className={`dropdown-item ${drawVariant === 'highlight' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDrawVariant('highlight');
                        editor.setCurrentTool('highlight');
                        setCurrentToolId('highlight');
                        setIsDrawMenuOpen(false);
                      }}
                    >
                      <TldrawUiIcon icon="tool-highlight" />
                      <span>Highlight</span>
                    </div>
                    <div
                      className={`dropdown-item ${drawVariant === 'laser' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDrawVariant('laser');
                        editor.setCurrentTool('laser');
                        setCurrentToolId('laser');
                        setIsDrawMenuOpen(false);
                      }}
                    >
                      <TldrawUiIcon icon="tool-laser" />
                      <span>Laser</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={tool.id}
              className={`tool-button ${currentToolId === tool.id ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.setCurrentTool(tool.id);
                setCurrentToolId(tool.id);
                setIsDrawMenuOpen(false);
              }}
              title={tool.label}
              style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
            >
              <TldrawUiIcon icon={tool.icon} />
            </button>
          );
        })}
      </div>

      {/* 下方独立 Plus 工具栏，距离上方 20px */}
      <div className="custom-toolbar">
        <div key="plus-group" className={`tool-group ${isPlusMenuOpen ? 'selected' : ''}`} ref={plusGroupRef}>
          <button
            className={`tool-button ${isPlusMenuOpen ? 'menu-open' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsPlusMenuOpen((v) => !v);
            }}
            title="更多"
            style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
          >
            <TldrawUiIcon icon={'plus'} />
            <span className="caret" />
            <span
              className="caret-hit"
              title="更多"
              onMouseEnter={() => {
                if (plusCloseTimerRef.current !== undefined) {
                  window.clearTimeout(plusCloseTimerRef.current);
                  plusCloseTimerRef.current = undefined;
                }
                setIsPlusMenuOpen(true);
              }}
              onMouseLeave={() => {
                plusCloseTimerRef.current = window.setTimeout(() => {
                  setIsPlusMenuOpen(false);
                  plusCloseTimerRef.current = undefined;
                }, 150);
              }}
            />
          </button>
          {/* 快速项：展示在加号按钮下方 */}
          {quickPinned.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {quickPinned.map((page) => {
                const label =
                  (page as any)?.workflow?.displayName
                    ? (getI18nContent((page as any).workflow.displayName) as string)
                    : (page as any)?.designProject?.displayName
                      ? (getI18nContent((page as any).designProject.displayName) as string)
                      : (page as any)?.agent?.displayName
                        ? (getI18nContent((page as any).agent.displayName) as string)
                        : (getI18nContent(page.displayName as any) as string) || (page as any)?.instance?.name || page.id;
                const icon = getPageIcon(page) || 'lucide:app-window';
                return (
                  <button
                    key={`quick-${page.id}`}
                    className="tool-button"
                    title={label}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 切换逻辑：
                    // - 当前显示 page&layer（mini 关闭）→ 打开 iframe（该page）
                    // - 当前显示 iframe（任意page）→ 关闭 iframe，回到 page&layer
                    if (miniActive) {
                      window.dispatchEvent(new CustomEvent('vines:close-pinned-page-mini'));
                    } else {
                      window.dispatchEvent(
                        new CustomEvent('vines:open-pinned-page-mini', { detail: { pageId: page.id, page } }),
                      );
                      window.dispatchEvent(
                        new CustomEvent('vines:open-pinned-page', { detail: { pageId: page.id, page } }),
                      );
                    }
                  }}
                  >
                    <VinesIcon size="xs">{icon}</VinesIcon>
                  </button>
                );
              })}
            </div>
          )}
          {isPlusMenuOpen && (
            <div
              className="dropdown-menu"
              style={{ maxHeight: 200, overflowY: 'auto', overscrollBehavior: 'contain', minWidth: 220 }}
              onMouseEnter={() => {
                if (plusCloseTimerRef.current !== undefined) {
                  window.clearTimeout(plusCloseTimerRef.current);
                  plusCloseTimerRef.current = undefined;
                }
                setIsPlusMenuOpen(true);
              }}
              onMouseLeave={() => {
                setIsPlusMenuOpen(false);
              }}
            >
                {(pinnedPages?.pages ?? []).map((page) => {
                  // 参照工作台：优先展示“应用/项目/Agent”的名称，而非视图名
                  const label =
                    (page as any)?.workflow?.displayName
                      ? (getI18nContent((page as any).workflow.displayName) as string)
                      : (page as any)?.designProject?.displayName
                        ? (getI18nContent((page as any).designProject.displayName) as string)
                        : (page as any)?.agent?.displayName
                          ? (getI18nContent((page as any).agent.displayName) as string)
                          : (getI18nContent(page.displayName as any) as string) || (page as any)?.instance?.name || page.id;
                  const exists = quickPinned.some((p) => p.id === page.id);
                  const icon = getPageIcon(page) || 'lucide:app-window';
                  return (
                    <div
                      key={page.id}
                      className="dropdown-item"
                      title={label}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    >
                      <span style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <VinesIcon size="xs" className="shrink-0">{icon}</VinesIcon>
                        <span className="truncate">{label}</span>
                      </span>
                      <button
                        className="tool-button"
                        style={{ width: 28, height: 28, minWidth: 28 }}
                        title={exists ? '移除快捷' : '添加到快捷'}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickPinned((prev) => (exists ? prev.filter((p) => p.id !== page.id) : [...prev, page]));
                        }}
                      >
                        <TldrawUiIcon icon={exists ? 'minus' : 'plus'} />
                      </button>
                    </div>
                  );
                })}
                {(!pinnedPages?.pages || pinnedPages.pages.length === 0) && (
                  <div className="dropdown-item" style={{ opacity: 0.6 }}>
                    <span>暂无置顶应用</span>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
