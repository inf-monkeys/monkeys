import { useEffect, useRef, useState } from 'react';

import './vertical-toolbar.scss';

import { GeoShapeGeoStyle } from '@tldraw/editor';
import { createShapeId, TLComponents, TldrawUiIcon, toRichText, useEditor } from 'tldraw';

import { useTldrawAgentV2 } from '@/agent/useTldrawAgentV2';
import { useSystemConfig } from '@/apis/common';
import { VinesIcon } from '@/components/ui/vines-icon';

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
  const [geoVariant, setGeoVariant] = useState<
    (typeof GeoShapeGeoStyle.values extends Iterable<infer T> ? T : never) | 'rectangle'
  >('rectangle');
  const geoGroupRef = useRef<HTMLDivElement | null>(null);
  const geoCloseTimerRef = useRef<number | undefined>(undefined);
  const agentApi = useTldrawAgentV2(editor);
  const activeOutputShapeIdRef = useRef<string | null>(null);
  const activeInputBoxShapeIdRef = useRef<string | null>(null);

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

  // 将 Agent 输出流式写入当前输出 shape
  useEffect(() => {
    if (!agentApi || !activeOutputShapeIdRef.current) return;
    const outTextId = activeOutputShapeIdRef.current;
    const lastAssistant = [...(agentApi.history || [])].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant || !lastAssistant.content) return;
    try {
      const outTextShape = editor.getShape(outTextId as any);
      if (outTextShape) {
        // 保持原有的宽度限制
        const existingProps = outTextShape.props as any;
        editor.updateShape({
          id: outTextId as any,
          type: 'text',
          props: {
            richText: toRichText(lastAssistant.content),
            autoSize: existingProps.autoSize,
            font: existingProps.font || 'sans',
            size: existingProps.size || 'm',
            color: existingProps.color || 'black',
            w: existingProps.w, // 保持宽度限制
          } as any,
        });
      }
    } catch {}
  }, [agentApi?.history, editor]);

  // 创建输入框（frame容器 + 文本 + 运行按钮）
  const createInstructionBox = () => {
    try {
      const vp = editor.getViewportPageBounds();
      const cx = vp.center.x;
      const cy = vp.center.y;

      const boxWidth = 360;
      const boxHeight = 120;
      const boxX = cx - boxWidth / 2;
      const boxY = cy - boxHeight / 2;

      // 创建 frame 作为输入框容器
      const frameId = createShapeId();
      editor.createShape({
        id: frameId,
        type: 'frame',
        x: boxX,
        y: boxY,
        props: {
          w: boxWidth,
          h: boxHeight,
          color: 'light-blue',
          name: '',
        } as any,
      });

      // 创建标题 "Input"
      editor.createShape({
        id: createShapeId(),
        type: 'text',
        x: boxX + 12,
        y: boxY + 8,
        props: {
          richText: toRichText('Input'),
          autoSize: true,
          font: 'sans',
          size: 's',
          color: 'black',
        } as any,
      });

      // 创建输入内容占位文本（确保文字在框内）
      const contentTextId = createShapeId();
      editor.createShape({
        id: contentTextId,
        type: 'text',
        x: boxX + 18,
        y: boxY + 36,
        props: {
          richText: toRichText('点击编辑...'),
          autoSize: true,
          font: 'sans',
          size: 'm',
          color: 'grey',
          w: boxWidth - 64, // 限制宽度，避免超出框
        } as any,
      });

      // 创建运行按钮（右上方）- 文本按钮，包含▶图标
      const buttonId = createShapeId();
      editor.createShape({
        id: buttonId,
        type: 'geo',
        x: boxX + boxWidth - 48,
        y: boxY + 8,
        props: {
          geo: 'rectangle',
          w: 36,
          h: 36,
          fill: 'solid',
          color: 'blue',
        } as any,
        meta: {
          isRunButton: true,
          frameId,
          contentTextId,
        } as any,
      });

      // 在按钮内部添加 ▶ 文本图标（作为按钮的一部分）
      editor.createShape({
        id: createShapeId(),
        type: 'text',
        x: boxX + boxWidth - 40,
        y: boxY + 16,
        props: {
          richText: toRichText('▶'),
          autoSize: true,
          font: 'sans',
          size: 'm',
          color: 'white',
        } as any,
        meta: {
          parentButton: buttonId,
          isButtonIcon: true,
        } as any,
      });

      activeInputBoxShapeIdRef.current = frameId;
    } catch (err) {
      console.warn('创建输入框失败:', err);
    }
  };

  // 处理运行按钮点击：创建箭头和输出框并触发Agent
  useEffect(() => {
    if (!agentApi) return;

    const handleRunButton = (buttonShapeId: string) => {
      try {
        const buttonShape = editor.getShape(buttonShapeId as any);
        if (!buttonShape) return;

        const isRunButton = (buttonShape as any).meta?.isRunButton;
        if (!isRunButton) return;

        // 检查是否已处理过（防止重复触发）
        if ((buttonShape as any).meta?.hasRun) {
          return;
        }

        // 标记为已处理
        editor.updateShape({
          id: buttonShapeId as any,
          type: buttonShape.type,
          meta: { ...(buttonShape as any).meta, hasRun: true },
        });

        const frameId = (buttonShape as any).meta?.frameId;
        const contentTextId = (buttonShape as any).meta?.contentTextId;
        if (!frameId || !contentTextId) return;

        // 获取输入框和输入内容
        const frameShape = editor.getShape(frameId as any);
        if (!frameShape) return;

        const contentTextShape = editor.getShape(contentTextId as any);
        const instructionText = contentTextShape
          ? (contentTextShape as any).props?.richText?.toString() || ''
          : '';
        const cleanInstruction = instructionText.replace('点击编辑...', '').trim();

        if (!cleanInstruction) {
          console.warn('输入内容为空');
          // 取消已处理标记
          editor.updateShape({
            id: buttonShapeId as any,
            type: buttonShape.type,
            meta: { ...(buttonShape as any).meta, hasRun: false },
          });
          return;
        }

        const frameX = (frameShape as any).x;
        const frameY = (frameShape as any).y;
        const frameWidth = (frameShape as any).props.w as number;
        const frameHeight = (frameShape as any).props.h as number;

        // 创建输出框 frame - 与输入框在同一水平线，高度相同
        const outputFrameId = createShapeId();
        const outputWidth = 400;
        const outputHeight = frameHeight; // 使用输入框的高度
        const gap = 120; // 输入框和输出框之间的间距
        const outputX = frameX + frameWidth + gap;
        const outputY = frameY; // 完全对齐

        editor.createShape({
          id: outputFrameId,
          type: 'frame',
          x: outputX,
          y: outputY,
          props: {
            w: outputWidth,
            h: outputHeight,
            color: 'grey',
            name: '',
          } as any,
        });

        // 创建 "Output" 标题
        editor.createShape({
          id: createShapeId(),
          type: 'text',
          x: outputX + 12,
          y: outputY + 8,
          props: {
            richText: toRichText('Output'),
            autoSize: true,
            font: 'sans',
            size: 's',
            color: 'black',
          } as any,
        });

        // 创建输出内容占位符（限制宽度，与输入框内容位置对应）
        const outputTextId = createShapeId();
        editor.createShape({
          id: outputTextId,
          type: 'text',
          x: outputX + 18,
          y: outputY + 36,
          props: {
            richText: toRichText('…'),
            autoSize: true,
            font: 'sans',
            size: 'm',
            color: 'grey',
            w: outputWidth - 54, // 限制宽度，避免超出框
          } as any,
        });

        // 创建箭头连接输入框右边缘和输出框左边缘
        // 箭头需要创建在页面层级，不在 frame 内
        const arrowId = createShapeId();
        // 箭头起点：输入框的右边缘中心（绝对坐标）
        const startX = frameX + frameWidth;
        const startY = frameY + frameHeight / 2;
        // 箭头终点：输出框的左边缘中心（绝对坐标）
        const endX = outputX;
        const endY = outputY + outputHeight / 2;

        // 使用 createShapes 在页面层级创建箭头，确保在外层显示
        editor.createShapes([{
          id: arrowId,
          type: 'arrow',
          x: startX,
          y: startY,
          props: {
            start: { x: 0, y: 0 },
            end: { x: endX - startX, y: endY - startY },
            arrowheadEnd: 'arrow',
            color: 'blue',
            size: 'm',
          } as any,
        }]);

        // 记录输出文本shape ID，用于流式更新
        activeOutputShapeIdRef.current = outputTextId as unknown as string;
        // 触发Agent请求
        agentApi.request({ message: cleanInstruction });
      } catch (err) {
        console.warn('运行按钮处理失败:', err);
      }
    };

    // 监听选择变化，检测运行按钮点击
    let lastProcessedShapeId: string | null = null;

    const handleSelectionChange = () => {
      const selectedIds = editor.getSelectedShapeIds();
      if (selectedIds.length !== 1) return;

      const shapeId = selectedIds[0];
      // 每次选择变化都检查是否是运行按钮（不依赖lastProcessedShapeId）
      try {
        const shape = editor.getShape(shapeId as any);
        if (!shape) return;

        const isRunButton = (shape as any).meta?.isRunButton;
        const isButtonIcon = (shape as any).meta?.isButtonIcon;
        const parentButton = (shape as any).meta?.parentButton;

        // 如果是按钮或按钮图标，都触发运行
        let buttonId: string | null = null;
        if (isRunButton && shapeId !== lastProcessedShapeId) {
          buttonId = shapeId;
        } else if (isButtonIcon && parentButton && shapeId !== lastProcessedShapeId) {
          // 点击图标时，触发父按钮
          buttonId = parentButton;
        }

        if (buttonId) {
          lastProcessedShapeId = shapeId;
          handleRunButton(buttonId);
        }
      } catch (err) {
        console.warn('处理选择失败:', err);
      }
    };

    editor.addListener('change', handleSelectionChange);

    return () => {
      editor.removeListener('change', handleSelectionChange);
    };
  }, [editor, agentApi]);

  // 定义工具栏中要显示的工具列表 - 使用正确的工具ID
  const oneOnOne = (oem as any)?.theme?.designProjects?.oneOnOne === true;
  const showInstructionButton = (oem as any)?.theme?.designProjects?.showInstructionButton === true;
  const toolbarTools = [
    { id: 'select', label: '选择', icon: 'tool-pointer' },
    { id: 'hand', label: '拖动', icon: 'tool-hand' },
    ...(!oneOnOne ? [{ id: 'frame', label: '画板', icon: 'tool-frame' }] : []),
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
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '20px',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: 20 }}>
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
                    <TldrawUiIcon
                      icon={
                        activeId === 'draw' ? 'tool-pencil' : activeId === 'highlight' ? 'tool-highlight' : 'tool-laser'
                      }
                    />
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
        <div className="custom-toolbar" style={{ marginLeft: 20 }}>
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

        {/* Instruction 框创建按钮（受配置开关控制）*/}
        {showInstructionButton && (
          <div className="custom-toolbar" style={{ marginLeft: 20 }}>
            <div className="tool-group">
              <button
                className="tool-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createInstructionBox();
                }}
                title="创建Instruction输入框"
                style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
              >
                <TldrawUiIcon icon="tool-note" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
