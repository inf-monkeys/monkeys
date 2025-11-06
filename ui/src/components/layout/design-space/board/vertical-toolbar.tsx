import { useEffect, useRef, useState } from 'react';

import './vertical-toolbar.scss';

import { GeoShapeGeoStyle } from '@tldraw/editor';
import { DefaultStylePanel, TLComponents, TldrawUiIcon, useEditor } from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import { getWorkflow } from '@/apis/workflow';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

// 导入 Workflow 节点图标
import { AddIcon } from './workflow-examples/src/components/icons/AddIcon';
import { ConditionalIcon } from './workflow-examples/src/components/icons/ConditionalIcon';
import { DivideIcon } from './workflow-examples/src/components/icons/DivideIcon';
import { MultiplyIcon } from './workflow-examples/src/components/icons/MultiplyIcon';
import { SliderIcon } from './workflow-examples/src/components/icons/SliderIcon';
import { SubtractIcon } from './workflow-examples/src/components/icons/SubtractIcon';

// 自定义竖向工具栏组件
export const VerticalToolbar: TLComponents['Toolbar'] = () => {
  const editor = useEditor();
  const { data: oem } = useSystemConfig();
  const [currentToolId, setCurrentToolId] = useState(editor.getCurrentToolId());
  const [isDrawMenuOpen, setIsDrawMenuOpen] = useState(false);
  const [drawVariant, setDrawVariant] = useState<'draw' | 'highlight' | 'laser'>('draw');
  const drawGroupRef = useRef<HTMLDivElement | null>(null);
  const drawCloseTimerRef = useRef<number | undefined>(undefined);
  const [isInstructionMenuOpen, setIsInstructionMenuOpen] = useState(false);
  const [instructionVariant, setInstructionVariant] = useState<'text' | 'image'>('text');
  const instructionGroupRef = useRef<HTMLDivElement | null>(null);
  const instructionCloseTimerRef = useRef<number | undefined>(undefined);
  const [isGeoMenuOpen, setIsGeoMenuOpen] = useState(false);
  const [geoVariant, setGeoVariant] = useState<
    (typeof GeoShapeGeoStyle.values extends Iterable<infer T> ? T : never) | 'rectangle'
  >('rectangle');
  const geoGroupRef = useRef<HTMLDivElement | null>(null);
  const geoCloseTimerRef = useRef<number | undefined>(undefined);
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const workflowGroupRef = useRef<HTMLDivElement | null>(null);
  const workflowCloseTimerRef = useRef<number | undefined>(undefined);
  const [isNodeMenuOpen, setIsNodeMenuOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('add');
  const nodeGroupRef = useRef<HTMLDivElement | null>(null);
  const nodeCloseTimerRef = useRef<number | undefined>(undefined);
  const [isStylePanelVisible, setIsStylePanelVisible] = useState(false);
  const stylePanelRef = useRef<HTMLDivElement | null>(null);
  const stylePanelButtonRef = useRef<HTMLButtonElement | null>(null);

  // 获取 pin 到工作台的工作流列表
  const { data: pinnedPagesData } = useWorkspacePages();
  // 从 pin 的页面中提取工作流列表（只包含有 workflow 的页面）
  const workflowList = pinnedPagesData?.pages
    ?.filter((page) => page.workflow && page.workflow.workflowId)
    .map((page) => {
      const workflow = page.workflow!;
      return {
        ...workflow,
        workflowId: workflow.workflowId || workflow.id || '',
        displayName: workflow.displayName,
        description: workflow.description,
        // 兼容 name 字段（如果 workflow 中没有 name，使用 displayName）
        name: (workflow as any).name || getI18nContent(workflow.displayName) || '',
      };
    }) || [];

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
      if (isInstructionMenuOpen) {
        if (instructionGroupRef.current && !instructionGroupRef.current.contains(target)) {
          setIsInstructionMenuOpen(false);
        }
      }
      if (isGeoMenuOpen) {
        if (geoGroupRef.current && !geoGroupRef.current.contains(target)) {
          setIsGeoMenuOpen(false);
        }
      }
      if (isWorkflowMenuOpen) {
        if (workflowGroupRef.current && !workflowGroupRef.current.contains(target)) {
          setIsWorkflowMenuOpen(false);
        }
      }
      if (isNodeMenuOpen) {
        if (nodeGroupRef.current && !nodeGroupRef.current.contains(target)) {
          setIsNodeMenuOpen(false);
        }
      }
      if (isStylePanelVisible) {
        // 检查点击是否在 StylePanel 或其按钮内
        const isClickInStylePanel =
          stylePanelRef.current?.contains(target) || stylePanelButtonRef.current?.contains(target);
        if (!isClickInStylePanel) {
          setIsStylePanelVisible(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isDrawMenuOpen, isInstructionMenuOpen, isGeoMenuOpen, isWorkflowMenuOpen, isNodeMenuOpen, isStylePanelVisible]);

  // 定义工具栏中要显示的工具列表 - 使用正确的工具ID
  const oneOnOne = (oem as any)?.theme?.designProjects?.oneOnOne === true;
  // 基础工具栏工具（不包含 workflow 相关工具）
  const toolbarTools = [
    { id: 'select', label: '选择', icon: 'tool-pointer' },
    { id: 'hand', label: '拖动', icon: 'tool-hand' },
    ...(!oneOnOne ? [{ id: 'frame', label: '画板', icon: 'tool-frame' }] : []),
    { id: 'shape', label: '形状', icon: 'geo-rectangle' },
    { id: 'draw', label: '绘制', icon: 'tool-pencil' },
    { id: 'style-panel', label: '样式面板', icon: 'palette' },
    { id: 'eraser', label: '橡皮擦', icon: 'tool-eraser' },
    { id: 'text', label: '文本', icon: 'tool-text' },
    { id: 'note', label: '便签', icon: 'tool-note' },
  ];

  // Workflow 相关工具（独立工具栏）
  const workflowTools = [
    { id: 'instruction', label: 'Instruction', icon: 'tool-text' },
    { id: 'output', label: 'Output', icon: 'tool-frame' },
    { id: 'workflow', label: '工作流', icon: 'tool-workflow' },
    { id: 'workflow-node', label: '流程节点', icon: 'tool-frame' },
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
      {/* StylePanel - 显示在 toolbar 上方 */}
      {isStylePanelVisible && (
        <div
          ref={stylePanelRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '20px',
            zIndex: 10000,
          }}
        >
          <DefaultStylePanel />
        </div>
      )}
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
                    <TldrawUiIcon icon={`geo-${String(activeId)}` as any} label={`形状: ${String(activeId)}`} />
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
                          <TldrawUiIcon icon={`geo-${String(id)}` as any} label={`形状: ${String(id)}`} />
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
                        <TldrawUiIcon icon="tool-arrow" label="箭头工具" />
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
                        <TldrawUiIcon icon="tool-line" label="直线工具" />
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
                      label={activeId === 'draw' ? '铅笔' : activeId === 'highlight' ? '荧光笔' : '激光笔'}
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
                        <TldrawUiIcon icon="tool-pencil" label="铅笔" />
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
                        <TldrawUiIcon icon="tool-highlight" label="荧光笔" />
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
                        <TldrawUiIcon icon="tool-laser" label="激光笔" />
                        <span>激光笔</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // instruction, output, workflow, workflow-node 已移到独立的 workflow 工具栏
            if (tool.id === 'instruction' || tool.id === 'output' || tool.id === 'workflow' || tool.id === 'workflow-node') {
              return null;
            }

            if (tool.id === 'style-panel') {
              return (
                <button
                  key={tool.id}
                  ref={stylePanelButtonRef}
                  className={`tool-button ${isStylePanelVisible ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsStylePanelVisible((prev) => !prev);
                  }}
                  title={tool.label}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <VinesIcon size="xs">lucide:palette</VinesIcon>
                </button>
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
                <TldrawUiIcon icon={tool.icon} label={tool.label || tool.id} />
              </button>
            );
          })}
        </div>

        {/* Workflow 工具栏（独立） */}
        <div className="custom-toolbar" style={{ marginLeft: 20 }}>
          {workflowTools.map((tool) => {
            if (tool.id === 'instruction') {
              const activeId = instructionVariant;
              const isActive = currentToolId === 'instruction';
              return (
                <div
                  key="instruction-group"
                  className={`tool-group ${isActive ? 'selected' : ''}`}
                  ref={instructionGroupRef}
                >
                  <button
                    className={`tool-button ${isActive ? 'selected' : ''} ${isInstructionMenuOpen ? 'menu-open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 设置输入模式并激活工具
                      const instructionTool = editor.getStateDescendant('instruction') as any;
                      if (instructionTool && instructionTool.setInputMode) {
                        instructionTool.setInputMode(activeId);
                      }
                      editor.setCurrentTool('instruction');
                      setCurrentToolId('instruction');
                      setIsInstructionMenuOpen(false);
                    }}
                    title={activeId === 'text' ? '文本节点' : '图片节点'}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{activeId === 'text' ? 'I' : '📷'}</span>
                    <span className="caret" />
                    <span
                      className="caret-hit"
                      title="更多输入模式"
                      onMouseEnter={() => {
                        if (instructionCloseTimerRef.current !== undefined) {
                          window.clearTimeout(instructionCloseTimerRef.current);
                          instructionCloseTimerRef.current = undefined;
                        }
                        setIsInstructionMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        instructionCloseTimerRef.current = window.setTimeout(() => {
                          setIsInstructionMenuOpen(false);
                          instructionCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsInstructionMenuOpen((v) => !v);
                      }}
                    />
                  </button>
                  {isInstructionMenuOpen && (
                    <div
                      className="dropdown-menu"
                      onMouseEnter={() => {
                        if (instructionCloseTimerRef.current !== undefined) {
                          window.clearTimeout(instructionCloseTimerRef.current);
                          instructionCloseTimerRef.current = undefined;
                        }
                        setIsInstructionMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setIsInstructionMenuOpen(false);
                      }}
                    >
                      <div
                        className={`dropdown-item ${instructionVariant === 'text' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInstructionVariant('text');
                          const instructionTool = editor.getStateDescendant('instruction') as any;
                          if (instructionTool && instructionTool.setInputMode) {
                            instructionTool.setInputMode('text');
                          }
                          editor.setCurrentTool('instruction');
                          setCurrentToolId('instruction');
                          setIsInstructionMenuOpen(false);
                        }}
                      >
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>I</span>
                        <span>文本节点</span>
                      </div>
                      <div
                        className={`dropdown-item ${instructionVariant === 'image' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInstructionVariant('image');
                          const instructionTool = editor.getStateDescendant('instruction') as any;
                          if (instructionTool && instructionTool.setInputMode) {
                            instructionTool.setInputMode('image');
                          }
                          editor.setCurrentTool('instruction');
                          setCurrentToolId('instruction');
                          setIsInstructionMenuOpen(false);
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>📷</span>
                        <span>图片节点</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (tool.id === 'output') {
              const isActive = currentToolId === 'output';
              return (
                <button
                  key={tool.id}
                  className={`tool-button ${isActive ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.setCurrentTool('output');
                    setCurrentToolId('output');
                  }}
                  title={tool.label}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>O</span>
                </button>
              );
            }

            if (tool.id === 'workflow') {
              const isActive = currentToolId === 'workflow';
              return (
                <div key="workflow-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={workflowGroupRef}>
                  <button
                    className={`tool-button ${isActive ? 'selected' : ''} ${isWorkflowMenuOpen ? 'menu-open' : ''}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedWorkflow) {
                        // 如果已选择工作流，激活工具并设置工作流数据
                        try {
                          // 获取工作流详细信息（包括输入参数）
                          const workflowDetail = await getWorkflow(selectedWorkflow.workflowId);

                          // 转换输入参数格式
                          const inputParams = (workflowDetail?.variables || []).map((variable: any) => ({
                            name: variable.name,
                            displayName: getI18nContent(variable.displayName) || variable.name,
                            type: variable.type || 'string',
                            value: variable.default !== undefined ? variable.default : '',
                            required: variable.required || false,
                            description:
                              getI18nContent(variable.description) || getI18nContent(variable.placeholder) || '',
                            typeOptions: variable.typeOptions || undefined,
                          }));

                          const workflowTool = editor.getStateDescendant('workflow') as any;
                          if (workflowTool && workflowTool.setWorkflowData) {
                            workflowTool.setWorkflowData({
                              workflowId: selectedWorkflow.workflowId,
                              workflowName:
                                getI18nContent(workflowDetail?.displayName || selectedWorkflow.displayName) ||
                                selectedWorkflow.name ||
                                '未命名工作流',
                              workflowDescription:
                                getI18nContent(workflowDetail?.description || selectedWorkflow.description) || '',
                              inputParams: inputParams,
                            });
                          }
                        } catch (error) {
                          console.error('获取工作流详情失败:', error);
                          const workflowTool = editor.getStateDescendant('workflow') as any;
                          if (workflowTool && workflowTool.setWorkflowData) {
                            workflowTool.setWorkflowData({
                              workflowId: selectedWorkflow.workflowId,
                              workflowName:
                                getI18nContent(selectedWorkflow.displayName) || selectedWorkflow.name || '未命名工作流',
                              workflowDescription: getI18nContent(selectedWorkflow.description) || '',
                              inputParams: [],
                            });
                          }
                        }
                        editor.setCurrentTool('workflow');
                        setCurrentToolId('workflow');
                      } else {
                        // 如果没有选择工作流，打开菜单
                        setIsWorkflowMenuOpen(true);
                      }
                    }}
                    title={
                      selectedWorkflow
                        ? `工作流: ${getI18nContent(selectedWorkflow.displayName) || selectedWorkflow.name}`
                        : '工作流'
                    }
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <VinesIcon size="xs">lucide:workflow</VinesIcon>
                    <span className="caret" />
                    <span
                      className="caret-hit"
                      title="选择工作流"
                      onMouseEnter={() => {
                        if (workflowCloseTimerRef.current !== undefined) {
                          window.clearTimeout(workflowCloseTimerRef.current);
                          workflowCloseTimerRef.current = undefined;
                        }
                        setIsWorkflowMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        workflowCloseTimerRef.current = window.setTimeout(() => {
                          setIsWorkflowMenuOpen(false);
                          workflowCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsWorkflowMenuOpen((v) => !v);
                      }}
                    />
                  </button>
                  {isWorkflowMenuOpen && (
                    <div
                      className="dropdown-menu workflow-list"
                      style={{ maxHeight: '300px', overflowY: 'auto' }}
                      onMouseEnter={() => {
                        if (workflowCloseTimerRef.current !== undefined) {
                          window.clearTimeout(workflowCloseTimerRef.current);
                          workflowCloseTimerRef.current = undefined;
                        }
                        setIsWorkflowMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setIsWorkflowMenuOpen(false);
                      }}
                    >
                      {(!workflowList || workflowList.length === 0) && (
                        <div className="dropdown-item" style={{ color: '#9CA3AF', cursor: 'default' }}>
                          <span>暂无工作流</span>
                        </div>
                      )}
                      {workflowList &&
                        workflowList.map((workflow: any) => (
                          <div
                            key={workflow.workflowId}
                            className={`dropdown-item ${selectedWorkflow?.workflowId === workflow.workflowId ? 'active' : ''}`}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedWorkflow(workflow);

                              try {
                                // 获取工作流详细信息（包括输入参数）
                                const workflowDetail = await getWorkflow(workflow.workflowId);

                                // 转换输入参数格式
                                const inputParams = (workflowDetail?.variables || []).map((variable: any) => ({
                                  name: variable.name,
                                  displayName: getI18nContent(variable.displayName) || variable.name,
                                  type: variable.type || 'string',
                                  value: variable.default !== undefined ? variable.default : '',
                                  required: variable.required || false,
                                  description:
                                    getI18nContent(variable.description) || getI18nContent(variable.placeholder) || '',
                                  typeOptions: variable.typeOptions || undefined,
                                }));

                                // 设置工作流数据并激活工具
                                const workflowTool = editor.getStateDescendant('workflow') as any;
                                if (workflowTool && workflowTool.setWorkflowData) {
                                  workflowTool.setWorkflowData({
                                    workflowId: workflow.workflowId,
                                    workflowName:
                                      getI18nContent(workflowDetail?.displayName || workflow.displayName) ||
                                      workflow.name ||
                                      '未命名工作流',
                                    workflowDescription:
                                      getI18nContent(workflowDetail?.description || workflow.description) || '',
                                    inputParams: inputParams,
                                  });
                                }
                                editor.setCurrentTool('workflow');
                                setCurrentToolId('workflow');
                              } catch (error) {
                                console.error('获取工作流详情失败:', error);
                                // 如果获取失败，使用基本信息
                                const workflowTool = editor.getStateDescendant('workflow') as any;
                                if (workflowTool && workflowTool.setWorkflowData) {
                                  workflowTool.setWorkflowData({
                                    workflowId: workflow.workflowId,
                                    workflowName:
                                      getI18nContent(workflow.displayName) || workflow.name || '未命名工作流',
                                    workflowDescription: getI18nContent(workflow.description) || '',
                                    inputParams: [],
                                  });
                                }
                                editor.setCurrentTool('workflow');
                                setCurrentToolId('workflow');
                              }

                              setIsWorkflowMenuOpen(false);
                            }}
                            title={getI18nContent(workflow.description) || ''}
                          >
                            <VinesIcon size="xs">lucide:workflow</VinesIcon>
                            <span
                              style={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {getI18nContent(workflow.displayName) || workflow.name || '未命名工作流'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            }

            if (tool.id === 'workflow-node') {
              const isActive = currentToolId === 'workflow-node';
              const nodeTypes = [
                { type: 'add', label: '加法', IconComponent: AddIcon },
                { type: 'subtract', label: '减法', IconComponent: SubtractIcon },
                { type: 'multiply', label: '乘法', IconComponent: MultiplyIcon },
                { type: 'divide', label: '除法', IconComponent: DivideIcon },
                { type: 'slider', label: '滑块', IconComponent: SliderIcon },
                { type: 'conditional', label: '条件', IconComponent: ConditionalIcon },
              ];
              const currentNode = nodeTypes.find((n) => n.type === selectedNodeType) || nodeTypes[0];
              const CurrentIcon = currentNode.IconComponent;

              return (
                <div key="node-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={nodeGroupRef}>
                  <button
                    className={`tool-button ${isActive ? 'selected' : ''} ${isNodeMenuOpen ? 'menu-open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const nodeTool = editor.getStateDescendant('workflow-node') as any;
                      if (nodeTool && nodeTool.setNodeType) {
                        nodeTool.setNodeType({ type: selectedNodeType });
                      }
                      editor.setCurrentTool('workflow-node');
                      setCurrentToolId('workflow-node');
                    }}
                    title={`流程节点: ${currentNode.label}`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CurrentIcon />
                    </div>
                    <span className="caret" />
                    <span
                      className="caret-hit"
                      title="选择节点类型"
                      onMouseEnter={() => {
                        if (nodeCloseTimerRef.current !== undefined) {
                          window.clearTimeout(nodeCloseTimerRef.current);
                          nodeCloseTimerRef.current = undefined;
                        }
                        setIsNodeMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        nodeCloseTimerRef.current = window.setTimeout(() => {
                          setIsNodeMenuOpen(false);
                          nodeCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsNodeMenuOpen((v) => !v);
                      }}
                    />
                  </button>
                  {isNodeMenuOpen && (
                    <div
                      className="dropdown-menu"
                      onMouseEnter={() => {
                        if (nodeCloseTimerRef.current !== undefined) {
                          window.clearTimeout(nodeCloseTimerRef.current);
                          nodeCloseTimerRef.current = undefined;
                        }
                        setIsNodeMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setIsNodeMenuOpen(false);
                      }}
                    >
                      {nodeTypes.map((nodeType) => {
                        const NodeIcon = nodeType.IconComponent;
                        return (
                          <div
                            key={nodeType.type}
                            className={`dropdown-item ${selectedNodeType === nodeType.type ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedNodeType(nodeType.type);
                              const nodeTool = editor.getStateDescendant('workflow-node') as any;
                              if (nodeTool && nodeTool.setNodeType) {
                                nodeTool.setNodeType({ type: nodeType.type });
                              }
                              editor.setCurrentTool('workflow-node');
                              setCurrentToolId('workflow-node');
                              setIsNodeMenuOpen(false);
                            }}
                          >
                            <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <NodeIcon />
                            </div>
                            <span>{nodeType.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
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
      </div>
    </div>
  );
};
