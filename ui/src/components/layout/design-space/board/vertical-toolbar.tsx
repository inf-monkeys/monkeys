import { useSystemConfig } from '@/apis/common';
import { VinesIcon } from '@/components/ui/vines-icon';
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
  
  // 检查是否显示 sidebar
  const showPageAndLayerSidebar = oem?.theme?.designProjects?.showPageAndLayerSidebar || false;
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  useEffect(() => {
    const handler = (e: any) => setLeftCollapsed(Boolean(e?.detail?.collapsed));
    window.addEventListener('vines:toggle-left-sidebar-body', handler as any);
    return () => window.removeEventListener('vines:toggle-left-sidebar-body', handler as any);
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
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isDrawMenuOpen, isGeoMenuOpen]);
  
  // 定义工具栏中要显示的工具列表 - 使用正确的工具ID
  const oneOnOne = (oem as any)?.theme?.designProjects?.oneOnOne === true;
  const toolbarTools = [
    { id: 'select', label: '选择', icon: 'tool-pointer' },
    { id: 'hand', label: '拖动', icon: 'tool-hand' },
    ...(!oneOnOne ? ([{ id: 'frame', label: '画板', icon: 'tool-frame' }]) : []),
    { id: 'shape', label: '形状', icon: 'geo-rectangle' },
    { id: 'draw', label: '绘制', icon: 'tool-pencil' },
    { id: 'eraser', label: '橡皮擦', icon: 'tool-eraser' },
    { id: 'text', label: '文本', icon: 'tool-text' },
    { id: 'note', label: '便签', icon: 'tool-note' },
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
                  title={`形状: ${String(activeId)}`}
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
                  title={activeId === 'draw' ? '铅笔' : activeId === 'highlight' ? '荧光笔' : '激光笔'}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <TldrawUiIcon icon={activeId === 'draw' ? 'tool-pencil' : activeId === 'highlight' ? 'tool-highlight' : 'tool-laser'} />
                  <span className="caret" />
                  <span
                    className="caret-hit"
                    title="更多画笔"
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
                      <span>铅笔</span>
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
                      <span>荧光笔</span>
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
                      <span>激光笔</span>
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

        {/* Agent toggle button */}
        <div className="custom-toolbar" style={{ marginTop: 20 }}>
          <div className="tool-group">
            <button
              className="tool-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('vines:toggle-agent-embed'));
              }}
              title="Agent"
              style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
            >
              <VinesIcon size="xs">lucide:bot</VinesIcon>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
