import React, { useEffect, useState } from 'react';
import { Editor } from 'tldraw';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface DiscoveredRelationship {
  id: string;
  type: string;
  sourceShapeId: string;
  targetShapeId: string;
  description: string;
  confidence: number;
}

export interface RelationshipDiscoveryResult {
  relationships: DiscoveredRelationship[];
  summary: string;
  processingTime: number;
}

interface RelationshipResultPanelProps {
  result: RelationshipDiscoveryResult | null;
  onClose: () => void;
  onApplyToCanvas: (result: RelationshipDiscoveryResult) => void;
  editor: Editor | null;
}

// 关系类型的中文映射和颜色
const RELATIONSHIP_TYPES: Record<string, { label: string; color: string }> = {
  related: { label: '相关关系', color: 'bg-gray-500' },
  requirement_to_feature: { label: '需求→功能', color: 'bg-blue-500' },
  feature_to_logic: { label: '功能→逻辑', color: 'bg-green-500' },
  logic_to_prototype: { label: '逻辑→原型', color: 'bg-purple-500' },
  depends_on: { label: '依赖关系', color: 'bg-orange-500' },
  contains: { label: '包含关系', color: 'bg-cyan-500' },
  causes: { label: '因果关系', color: 'bg-red-500' },
};

/**
 * 关系发现结果展示面板
 *
 * 显示发现的逻辑关系，并提供应用到画布的功能
 */
export const RelationshipResultPanel: React.FC<RelationshipResultPanelProps> = ({
  result,
  onClose,
  onApplyToCanvas,
  editor,
}) => {
  const [expandedRelationships, setExpandedRelationships] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!result) return null;

  const toggleRelationship = (id: string) => {
    setExpandedRelationships((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在标题栏区域触发拖动
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleApplyToCanvas = () => {
    onApplyToCanvas(result);
  };

  // 按关系类型分组
  const groupedRelationships = result.relationships.reduce(
    (acc, rel) => {
      const type = rel.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(rel);
      return acc;
    },
    {} as Record<string, DiscoveredRelationship[]>,
  );

  // 获取图形名称（尝试从editor获取）
  const getShapeName = (shapeId: string): string => {
    if (!editor) return shapeId;
    try {
      const shape = editor.getShape(shapeId);
      if (shape?.props?.text) {
        return String(shape.props.text).substring(0, 30);
      }
      if (shape?.props?.label) {
        return String(shape.props.label).substring(0, 30);
      }
      return `${shape?.type || 'Shape'} (${shapeId.substring(0, 8)})`;
    } catch {
      return shapeId.substring(0, 8);
    }
  };

  // 计算置信度颜色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className="fixed w-80 h-[500px] z-[200] pointer-events-auto"
      style={{
        left: position.x === 0 ? 'auto' : `${position.x}px`,
        top: position.y === 0 ? '50%' : `${position.y}px`,
        right: position.x === 0 ? '1rem' : 'auto',
        transform: position.x === 0 && position.y === 0 ? 'translateY(-50%)' : 'none',
      }}
    >
      <Card className="shadow-2xl overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div
          className="bg-white p-4 border-b flex items-center justify-between drag-handle cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">逻辑关系分析结果</h3>
            <p className="text-sm text-gray-600">
              发现 {result.relationships.length} 个关系 · 耗时{' '}
              {(result.processingTime / 1000).toFixed(2)}s
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-700">{result.summary}</p>
        </div>

        {/* Relationships List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.entries(groupedRelationships).map(([type, relationships]) => {
            const typeInfo = RELATIONSHIP_TYPES[type] || {
              label: type,
              color: 'bg-gray-500',
            };

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${typeInfo.color} text-white`}>{typeInfo.label}</Badge>
                  <span className="text-sm text-gray-500">({relationships.length})</span>
                </div>

                {relationships.map((rel) => (
                  <Collapsible
                    key={rel.id}
                    open={expandedRelationships.has(rel.id)}
                    onOpenChange={() => toggleRelationship(rel.id)}
                  >
                    <Card className="p-3 hover:shadow-md transition-shadow">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                {getShapeName(rel.sourceShapeId)}
                              </span>
                              <span className="text-xs text-gray-400">→</span>
                              <span className="text-xs text-gray-500">
                                {getShapeName(rel.targetShapeId)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 line-clamp-1">
                              {rel.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs font-semibold ${getConfidenceColor(rel.confidence)}`}
                            >
                              {(rel.confidence * 100).toFixed(0)}%
                            </span>
                            {expandedRelationships.has(rel.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t space-y-2 text-xs text-gray-600">
                          <div>
                            <span className="font-semibold">描述：</span>
                            <div className="text-sm text-gray-700 mt-1">{rel.description}</div>
                          </div>
                          <div>
                            <span className="font-semibold">源图形ID：</span>
                            <div className="font-mono break-all text-gray-500 mt-1">{rel.sourceShapeId}</div>
                          </div>
                          <div>
                            <span className="font-semibold">目标图形ID：</span>
                            <div className="font-mono break-all text-gray-500 mt-1">{rel.targetShapeId}</div>
                          </div>
                          <div>
                            <span className="font-semibold">置信度：</span>
                            <span className={getConfidenceColor(rel.confidence)}>
                              {(rel.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
