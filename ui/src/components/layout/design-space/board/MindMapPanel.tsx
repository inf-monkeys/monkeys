import { Button } from '@/components/ui/button';
import * as d3 from 'd3';
import { Download, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'requirement' | 'feature' | 'logic' | 'prototype';
  description?: string;
  level: number;
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface MindMapResult {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  summary: string;
  processingTime?: number;
}

interface MindMapPanelProps {
  result: MindMapResult;
  onClose: () => void;
  onApply: (result: MindMapResult) => void;
  onUpdateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  onAddNode: (node: MindMapNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddEdge: (edge: MindMapEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  onGenerateSolution?: () => void;
  onProvideCreativity?: () => void;
  onDiscoverRelationship?: () => void;
  aiInsight?: string;
  isGeneratingInsight?: boolean;
  currentInsightType?: 'solution' | 'creativity' | 'relationship' | null;
}

const NODE_TYPE_CONFIG = {
  requirement: { label: '需求', color: '#93C5FD', textColor: '#1E40AF' },
  feature: { label: '功能', color: '#86EFAC', textColor: '#15803D' },
  logic: { label: '逻辑', color: '#C4B5FD', textColor: '#6D28D9' },
  prototype: { label: '原型', color: '#FDBA74', textColor: '#C2410C' },
};

type D3Node = MindMapNode & d3.SimulationNodeDatum;
type D3Link = {
  source: string | D3Node;
  target: string | D3Node;
  edge: MindMapEdge;
};

export const MindMapPanel: React.FC<MindMapPanelProps> = ({
  result,
  onClose,
  onApply,
  onUpdateNode,
  onAddNode,
  onDeleteNode,
  onAddEdge,
  onGenerateSolution,
  onProvideCreativity,
  onDiscoverRelationship,
  aiInsight,
  isGeneratingInsight = false,
  currentInsightType = null,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: MindMapNode;
  } | null>(null);

  // 编辑节点对话框状态
  const [editDialog, setEditDialog] = useState<{
    node: MindMapNode;
    label: string;
    description: string;
  } | null>(null);

  // 添加子节点对话框状态
  const [addChildDialog, setAddChildDialog] = useState<{
    parentNode: MindMapNode;
    label: string;
    type: MindMapNode['type'];
    description: string;
  } | null>(null);

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState<MindMapNode | null>(null);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!svgRef.current || result.nodes.length === 0) return;

    const width = 420;
    const height = 300;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // 创建一个容器组，用于缩放和平移
    const g = svg.append('g');

    // 添加缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 准备数据
    const nodes: D3Node[] = result.nodes.map((node) => ({ ...node }));
    const links: D3Link[] = result.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      edge,
    }));

    // 半径等级（调整为更小的尺寸）
    const radiusLevels = {
      requirement: 60,
      feature: 90,
      logic: 120,
      prototype: 150,
    };

    // 创建力导向模拟
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(50)
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      // 添加径向力，将不同类型的节点推到不同的圆环上
      .force('radial', d3.forceRadial((d: any) => {
        return radiusLevels[d.type as keyof typeof radiusLevels] || 150;
      }, width / 2, height / 2).strength(0.8));

    // 绘制连接线
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.5);

    // 绘制节点组
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        event.stopPropagation();

        // 获取鼠标在容器中的位置
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setContextMenu({
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top,
            node: d as MindMapNode,
          });
        }
      })
      .call(d3.drag<any, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // 添加圆形节点
    node.append('circle')
      .attr('r', (d, i) => i === 0 ? 18 : 15) // 缩小节点尺寸
      .attr('fill', (d) => NODE_TYPE_CONFIG[d.type].color)
      .attr('stroke', (d) => NODE_TYPE_CONFIG[d.type].textColor)
      .attr('stroke-width', (d, i) => i === 0 ? 2.5 : 2)
      .style('cursor', 'pointer')
      .style('filter', (d, i) => i === 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none');

    // 添加节点标签（显示在节点下方）
    node.append('text')
      .text((d) => d.label.length > 8 ? d.label.slice(0, 7) + '...' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d, i) => i === 0 ? 32 : 28) // 标签在节点下方
      .attr('font-size', (d, i) => i === 0 ? 11 : 10)
      .attr('font-weight', (d, i) => i === 0 ? 600 : 400)
      .attr('fill', '#4B5563') // 统一的深灰色
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 清理函数
    return () => {
      simulation.stop();
    };
  }, [result]);

  // 下载知识图谱为图片
  const handleDownload = () => {
    if (!svgRef.current) return;

    try {
      // 创建一个临时的 canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 设置 canvas 尺寸
      const width = 420;
      const height = 300;
      canvas.width = width * 2; // 使用2倍分辨率以提高清晰度
      canvas.height = height * 2;

      // 获取 SVG 元素
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);

      // 创建 Blob 和 Image
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        // 绘制白色背景
        ctx.fillStyle = '#F9FAFB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制 SVG 图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 转换为 PNG 并下载
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `思维图谱_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/png');

        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('下载图片失败:', error);
      alert('下载失败，请重试');
    }
  };

  // 右键菜单处理函数
  const handleAddChild = () => {
    if (!contextMenu) return;
    setAddChildDialog({
      parentNode: contextMenu.node,
      label: '',
      type: 'feature',
      description: '',
    });
    setContextMenu(null);
  };

  const handleEditNode = () => {
    if (!contextMenu) return;
    setEditDialog({
      node: contextMenu.node,
      label: contextMenu.node.label,
      description: contextMenu.node.description || '',
    });
    setContextMenu(null);
  };

  const handleDeleteNode = () => {
    if (!contextMenu) return;
    setDeleteDialog(contextMenu.node);
    setContextMenu(null);
  };

  // 确认添加子节点
  const handleConfirmAddChild = () => {
    if (!addChildDialog) return;

    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      label: addChildDialog.label,
      type: addChildDialog.type,
      description: addChildDialog.description,
      level: addChildDialog.parentNode.level + 1,
    };

    const newEdge: MindMapEdge = {
      id: `edge-${Date.now()}`,
      from: addChildDialog.parentNode.id,
      to: newNode.id,
    };

    onAddNode(newNode);
    onAddEdge(newEdge);
    setAddChildDialog(null);
  };

  // 确认编辑节点
  const handleConfirmEdit = () => {
    if (!editDialog) return;

    onUpdateNode(editDialog.node.id, {
      label: editDialog.label,
      description: editDialog.description,
    });
    setEditDialog(null);
  };

  // 确认删除节点
  const handleConfirmDelete = () => {
    if (!deleteDialog) return;
    onDeleteNode(deleteDialog.id);
    setDeleteDialog(null);
  };

  return (
    <>
      <Draggable handle=".drag-handle" cancel=".no-drag">
        <div
          ref={containerRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden flex flex-col"
          style={{
            width: '420px',
            height: aiInsight ? '500px' : '390px',
            right: '20px',
            top: 'calc(50vh - 80px)',
            transform: 'translateY(-50%)',
            zIndex: 1000,
          }}
        >
          {/* 标题栏 */}
          <div className="drag-handle flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 cursor-move">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">思维图谱</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="xs"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 no-drag h-6 w-6 p-0"
                title="下载图片"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="xs"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 no-drag h-6 w-6 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="border-b border-gray-200 px-3 py-2 bg-white flex items-center gap-2">
            <Button
              onClick={onGenerateSolution}
              variant="ghost"
              size="xs"
              disabled={isGeneratingInsight}
              className="h-7 text-xs flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentInsightType === 'solution' && isGeneratingInsight ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span>💡</span>
                  <span>生成方案</span>
                </>
              )}
            </Button>
            <Button
              onClick={onProvideCreativity}
              variant="ghost"
              size="xs"
              disabled={isGeneratingInsight}
              className="h-7 text-xs flex items-center gap-1 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentInsightType === 'creativity' && isGeneratingInsight ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>提供创意</span>
                </>
              )}
            </Button>
            <Button
              onClick={onDiscoverRelationship}
              variant="ghost"
              size="xs"
              disabled={isGeneratingInsight}
              className="h-7 text-xs flex items-center gap-1 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentInsightType === 'relationship' && isGeneratingInsight ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>挖掘关系</span>
                </>
              )}
            </Button>
          </div>

          {/* 图谱可视化区域 */}
          <div className="relative bg-gray-50 no-drag flex-shrink-0" style={{ height: '300px' }}>
            <svg ref={svgRef} className="w-full h-full" />

            {/* 提示信息 */}
            <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 rounded text-xs text-gray-500 shadow-sm">
              <div>拖拽节点 · 滚轮缩放 · 右键菜单</div>
            </div>

            {/* 右键菜单 */}
            {contextMenu && (
              <div
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50"
                style={{
                  left: `${contextMenu.x}px`,
                  top: `${contextMenu.y}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleAddChild}
                >
                  <span>➕</span>
                  <span>添加子节点</span>
                </button>
                <button
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleEditNode}
                >
                  <span>✏️</span>
                  <span>编辑节点</span>
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  onClick={handleDeleteNode}
                >
                  <span>🗑️</span>
                  <span>删除节点</span>
                </button>
              </div>
            )}
          </div>

          {/* AI 洞察显示区域 */}
          {(aiInsight || isGeneratingInsight) && (
            <div className="border-t border-gray-200 bg-gray-50 flex-1 overflow-y-auto no-drag">
              <div className="p-3">
                {isGeneratingInsight ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">AI 正在分析中...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiInsight}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Draggable>

      {/* 添加子节点对话框 */}
      {addChildDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-lg shadow-xl p-4 w-96">
            <h3 className="text-lg font-semibold mb-3">添加子节点</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  父节点: {addChildDialog.parentNode.label}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={addChildDialog.label}
                  onChange={(e) =>
                    setAddChildDialog({ ...addChildDialog, label: e.target.value })
                  }
                  placeholder="请输入节点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">节点类型</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={addChildDialog.type}
                  onChange={(e) =>
                    setAddChildDialog({
                      ...addChildDialog,
                      type: e.target.value as MindMapNode['type'],
                    })
                  }
                >
                  <option value="requirement">需求</option>
                  <option value="feature">功能</option>
                  <option value="logic">逻辑</option>
                  <option value="prototype">原型</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  value={addChildDialog.description}
                  onChange={(e) =>
                    setAddChildDialog({ ...addChildDialog, description: e.target.value })
                  }
                  placeholder="请输入节点描述（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setAddChildDialog(null)}
                className="h-8"
              >
                取消
              </Button>
              <Button
                size="xs"
                onClick={handleConfirmAddChild}
                disabled={!addChildDialog.label.trim()}
                className="h-8"
              >
                确定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑节点对话框 */}
      {editDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-lg shadow-xl p-4 w-96">
            <h3 className="text-lg font-semibold mb-3">编辑节点</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={editDialog.label}
                  onChange={(e) => setEditDialog({ ...editDialog, label: e.target.value })}
                  placeholder="请输入节点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  value={editDialog.description}
                  onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })}
                  placeholder="请输入节点描述（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditDialog(null)}
                className="h-8"
              >
                取消
              </Button>
              <Button
                size="xs"
                onClick={handleConfirmEdit}
                disabled={!editDialog.label.trim()}
                className="h-8"
              >
                确定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-lg shadow-xl p-4 w-96">
            <h3 className="text-lg font-semibold mb-3">确认删除</h3>
            <p className="text-sm text-gray-600 mb-4">
              确定要删除节点 "<span className="font-medium">{deleteDialog.label}</span>" 吗？
              <br />
              删除后将同时移除与该节点相关的所有连接。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteDialog(null)}
                className="h-8"
              >
                取消
              </Button>
              <Button
                size="xs"
                onClick={handleConfirmDelete}
                className="h-8 bg-red-600 hover:bg-red-700"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
