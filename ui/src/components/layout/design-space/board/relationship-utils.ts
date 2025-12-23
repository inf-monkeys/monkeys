import { Editor, createShapeId } from 'tldraw';
import type { DiscoveredRelationship, RelationshipDiscoveryResult } from './RelationshipResultPanel';

// 关系类型到颜色的映射
const RELATIONSHIP_COLORS: Record<string, string> = {
  related: 'grey',
  requirement_to_feature: 'blue',
  feature_to_logic: 'green',
  logic_to_prototype: 'violet',
  depends_on: 'orange',
  contains: 'light-blue',
  causes: 'red',
};

// 关系类型到标签的映射
const RELATIONSHIP_LABELS: Record<string, string> = {
  related: '相关',
  requirement_to_feature: '需求→功能',
  feature_to_logic: '功能→逻辑',
  logic_to_prototype: '逻辑→原型',
  depends_on: '依赖',
  contains: '包含',
  causes: '因果',
};

/**
 * 将关系结果应用到画布
 * 在相关图形之间绘制箭头线
 */
export function applyRelationshipsToCanvas(
  editor: Editor,
  result: RelationshipDiscoveryResult,
): void {
  if (!editor || !result.relationships || result.relationships.length === 0) {
    return;
  }

  // 开始批量操作
  editor.batch(() => {
    for (const relationship of result.relationships) {
      try {
        createRelationshipArrow(editor, relationship);
      } catch (error) {
        console.error('Failed to create relationship arrow:', error, relationship);
      }
    }
  });

  // 适应视图以显示所有内容
  editor.zoomToFit({ animation: { duration: 300 } });
}

/**
 * 创建表示关系的箭头
 */
function createRelationshipArrow(editor: Editor, relationship: DiscoveredRelationship): void {
  const sourceShape = editor.getShape(relationship.sourceShapeId);
  const targetShape = editor.getShape(relationship.targetShapeId);

  if (!sourceShape || !targetShape) {
    console.warn(
      `Shape not found: source=${relationship.sourceShapeId}, target=${relationship.targetShapeId}`,
    );
    return;
  }

  // 计算源和目标的中心点
  const sourceCenter = getShapeCenter(editor, sourceShape);
  const targetCenter = getShapeCenter(editor, targetShape);

  // 获取关系的颜色和标签
  const color = RELATIONSHIP_COLORS[relationship.type] || 'black';
  const label = RELATIONSHIP_LABELS[relationship.type] || relationship.type;

  // 创建箭头形状
  const arrowId = createShapeId();

  editor.createShape({
    id: arrowId,
    type: 'arrow',
    x: sourceCenter.x,
    y: sourceCenter.y,
    props: {
      start: {
        x: 0,
        y: 0,
      },
      end: {
        x: targetCenter.x - sourceCenter.x,
        y: targetCenter.y - sourceCenter.y,
      },
      color,
      // 箭头样式
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      // 线条样式
      dash: relationship.confidence < 0.7 ? 'dashed' : 'draw',
      size: 'm',
      // 标签
      text: `${label}\n${(relationship.confidence * 100).toFixed(0)}%`,
    },
  });

  // 将箭头移到最底层，避免遮挡其他图形
  editor.sendToBack([arrowId]);
}

/**
 * 获取图形的中心点
 */
function getShapeCenter(editor: Editor, shape: any): { x: number; y: number } {
  const bounds = editor.getShapePageBounds(shape);
  if (!bounds) {
    // 如果无法获取边界，使用图形的位置
    return { x: shape.x, y: shape.y };
  }

  return {
    x: bounds.x + bounds.w / 2,
    y: bounds.y + bounds.h / 2,
  };
}

/**
 * 清除画布上的所有关系箭头
 * （可以通过特定的元数据标记来识别关系箭头）
 */
export function clearRelationshipArrows(editor: Editor): void {
  // 这里可以实现清除逻辑，比如通过特殊标记识别关系箭头
  // 目前暂不实现，因为用户可能需要手动删除
}
