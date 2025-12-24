import React, { useEffect, useState } from 'react';
import { Editor, useEditor, track } from 'tldraw';
import { Button } from '@/components/ui/button';
import { useSystemConfig } from '@/apis/common';

interface MindMapButtonProps {
  onGenerateMindMap: (selectedShapes: any[]) => void;
  loading?: boolean;
}

/**
 * 思维图谱生成按钮组件
 *
 * 按照设计学的需求-功能-逻辑-原型的因果映射关系生成思维图谱
 * 按钮位置在发现逻辑关系按钮的左边
 */
export const MindMapButton: React.FC<MindMapButtonProps> = track(
  ({ onGenerateMindMap, loading = false }) => {
    const editor = useEditor();
    const [selectedShapes, setSelectedShapes] = useState<any[]>([]);
    const { data: oem } = useSystemConfig();

    // 检查是否启用了思维图谱功能
    const agentTools = (oem as any)?.theme?.designProjects?.AgentTools || [];
    const isEnabled = agentTools.includes('mind-graph');

    if (!editor || !isEnabled) return null;

    // 获取选中的图形ID
    const selectedShapeIds = Array.from(editor.getSelectedShapeIds());

    // 获取选中图形的数据
    useEffect(() => {
      if (selectedShapeIds.length < 2) {
        setSelectedShapes([]);
        return;
      }

      const shapes = selectedShapeIds
        .map((id) => {
          const shape = editor.getShape(id);
          return shape
            ? {
                id: shape.id,
                type: shape.type,
                props: shape.props,
                x: shape.x,
                y: shape.y,
                rotation: shape.rotation,
              }
            : null;
        })
        .filter(Boolean);
      setSelectedShapes(shapes);
    }, [selectedShapeIds.join(','), editor]);

    // 只有选中2个或以上图形时才显示按钮
    if (selectedShapeIds.length < 2) {
      return null;
    }

    // 计算选中区域的边界框
    const selectionBounds = editor.getSelectionPageBounds();
    if (!selectionBounds) {
      return null;
    }

    // 将页面坐标转换为屏幕坐标
    const bottomRight = editor.pageToScreen({
      x: selectionBounds.x + selectionBounds.w,
      y: selectionBounds.y + selectionBounds.h
    });

    // 计算按钮位置：在选中区域右下角，但在发现逻辑关系按钮的左边（留出160px的间距）
    const buttonX = bottomRight.x - 160; // 在关系发现按钮左边，留出按钮宽度的间距
    const buttonY = bottomRight.y + 10; // 在选中区域下方10px

    const handleClick = () => {
      if (loading || selectedShapes.length === 0) return;
      onGenerateMindMap(selectedShapes);
    };

    return (
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          left: `${buttonX}px`,
          top: `${buttonY}px`,
          transform: 'translateX(-100%)',
          zIndex: 999,
        }}
      >
        <Button
          onClick={handleClick}
          disabled={loading}
          variant="outline"
          className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm pointer-events-auto"
          size="sm"
        >
          {loading ? '生成中...' : '思维图谱'}
        </Button>
      </div>
    );
  },
);
