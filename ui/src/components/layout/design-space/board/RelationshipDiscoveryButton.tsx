import React, { useEffect, useState } from 'react';
import { Editor, useEditor, track } from 'tldraw';
import { Button } from '@/components/ui/button';

interface RelationshipDiscoveryButtonProps {
  onDiscoverRelationships: (selectedShapes: any[]) => void;
  loading?: boolean;
}

/**
 * 逻辑关系发现按钮组件（内部实现）
 *
 * 使用 track 来响应编辑器状态变化（选中的图形、视口位置等）
 */
export const RelationshipDiscoveryButton: React.FC<RelationshipDiscoveryButtonProps> = track(
  ({ onDiscoverRelationships, loading = false }) => {
    const editor = useEditor();
    const [selectedShapes, setSelectedShapes] = useState<any[]>([]);

    if (!editor) return null;

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

    // 获取编辑器容器的边界，用于计算相对位置
    const container = editor.getContainer();
    const containerRect = container.getBoundingClientRect();

    // 将页面坐标转换为屏幕坐标（相对于视口）
    const topLeft = editor.pageToScreen({ x: selectionBounds.x, y: selectionBounds.y });
    const bottomRight = editor.pageToScreen({
      x: selectionBounds.x + selectionBounds.w,
      y: selectionBounds.y + selectionBounds.h
    });

    // 计算按钮位置：在选中区域右下角，与右边对齐（相对于视口）
    const buttonX = bottomRight.x; // 与选中区域右边对齐
    const buttonY = bottomRight.y + 10; // 在选中区域下方10px

    // 调试输出
    console.log('[RelationshipDiscoveryButton] 位置计算:', {
      selectionBounds,
      containerRect,
      topLeft,
      bottomRight,
      buttonX,
      buttonY,
    });

    const handleClick = () => {
      if (loading || selectedShapes.length === 0) return;
      onDiscoverRelationships(selectedShapes);
    };

    return (
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          left: `${buttonX}px`,
          top: `${buttonY}px`,
          transform: 'translateX(-100%)', // 让按钮右边与计算位置对齐
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
          {loading ? '分析中...' : '发现逻辑关系'}
        </Button>
      </div>
    );
  },
);
