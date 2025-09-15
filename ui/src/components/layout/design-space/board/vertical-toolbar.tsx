import { useSystemConfig } from '@/apis/common';
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
        left: '16px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
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
        {/* Plus menu at bottom */}
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
          {isPlusMenuOpen && (
            <div
              className="dropdown-menu"
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
              <div className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span>智能体</span>
              </div>
              <div className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span>灵感生成</span>
              </div>
              <div className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span>融合生成</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
