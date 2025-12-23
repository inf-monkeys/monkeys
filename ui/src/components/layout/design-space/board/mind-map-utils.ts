import { Editor, createShapeId } from 'tldraw';
import type { MindMapResult, MindMapNode, MindMapEdge } from './MindMapPanel';

// 节点类型到颜色的映射
const NODE_TYPE_COLORS: Record<MindMapNode['type'], string> = {
  requirement: 'light-blue',
  feature: 'green',
  logic: 'violet',
  prototype: 'orange',
};

// 节点类型到标签的映射
const NODE_TYPE_LABELS: Record<MindMapNode['type'], string> = {
  requirement: '需求',
  feature: '功能',
  logic: '逻辑',
  prototype: '原型',
};

/**
 * 将思维图谱应用到画布
 * 按照层级布局渲染节点和连接
 */
export function applyMindMapToCanvas(editor: Editor, result: MindMapResult): void {
  if (!editor || !result.nodes || result.nodes.length === 0) {
    return;
  }

  // 清除之前的思维图谱（如果有标记）
  clearPreviousMindMap(editor);

  // 计算布局
  const layout = calculateMindMapLayout(result);

  // 开始批量操作
  editor.batch(() => {
    // 创建所有节点
    const shapeIdMap = new Map<string, string>();
    for (const node of result.nodes) {
      const position = layout.get(node.id);
      if (position) {
        const shapeId = createMindMapNode(editor, node, position);
        shapeIdMap.set(node.id, shapeId);
      }
    }

    // 创建所有连接线
    for (const edge of result.edges) {
      const sourceShapeId = shapeIdMap.get(edge.from);
      const targetShapeId = shapeIdMap.get(edge.to);
      if (sourceShapeId && targetShapeId) {
        createMindMapEdge(editor, edge, sourceShapeId, targetShapeId);
      }
    }
  });

  // 适应视图以显示所有内容
  setTimeout(() => {
    editor.zoomToFit({ animation: { duration: 300 } });
  }, 100);
}

/**
 * 计算思维图谱的布局
 * 按照需求→功能→逻辑→原型的层级从左到右排列
 */
function calculateMindMapLayout(
  result: MindMapResult,
): Map<string, { x: number; y: number }> {
  const layout = new Map<string, { x: number; y: number }>();

  // 定义层级顺序
  const levelOrder: MindMapNode['type'][] = ['requirement', 'feature', 'logic', 'prototype'];

  // 按类型分组节点
  const nodesByType = result.nodes.reduce((acc, node) => {
    if (!acc[node.type]) {
      acc[node.type] = [];
    }
    acc[node.type].push(node);
    return acc;
  }, {} as Record<string, MindMapNode[]>);

  // 布局参数
  const horizontalSpacing = 300; // 层级之间的水平间距
  const verticalSpacing = 150; // 同层节点之间的垂直间距
  const startX = 100; // 起始X坐标
  const startY = 100; // 起始Y坐标

  // 为每个层级计算位置
  levelOrder.forEach((type, levelIndex) => {
    const nodes = nodesByType[type] || [];
    const levelX = startX + levelIndex * horizontalSpacing;

    nodes.forEach((node, nodeIndex) => {
      const levelY = startY + nodeIndex * verticalSpacing;
      layout.set(node.id, { x: levelX, y: levelY });
    });
  });

  return layout;
}

/**
 * 创建思维图谱节点
 */
function createMindMapNode(
  editor: Editor,
  node: MindMapNode,
  position: { x: number; y: number },
): string {
  const shapeId = createShapeId();
  const color = NODE_TYPE_COLORS[node.type];
  const typeLabel = NODE_TYPE_LABELS[node.type];

  // 构建节点文本
  let text = `【${typeLabel}】\n${node.label}`;
  if (node.description) {
    text += `\n\n${node.description}`;
  }

  editor.createShape({
    id: shapeId,
    type: 'geo',
    x: position.x,
    y: position.y,
    props: {
      geo: 'rectangle',
      w: 200,
      h: 100,
      color,
      fill: 'semi',
      text,
      font: 'sans',
      size: 'm',
      align: 'middle',
      verticalAlign: 'middle',
    },
    meta: {
      mindMapNode: true,
      mindMapNodeId: node.id,
      mindMapNodeType: node.type,
    },
  });

  return shapeId;
}

/**
 * 创建思维图谱连接线
 */
function createMindMapEdge(
  editor: Editor,
  edge: MindMapEdge,
  sourceShapeId: string,
  targetShapeId: string,
): void {
  const sourceShape = editor.getShape(sourceShapeId);
  const targetShape = editor.getShape(targetShapeId);

  if (!sourceShape || !targetShape) {
    console.warn(`Shape not found for edge: ${edge.id}`);
    return;
  }

  // 计算源和目标的中心点
  const sourceCenter = getShapeCenter(editor, sourceShape);
  const targetCenter = getShapeCenter(editor, targetShape);

  // 创建箭头
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
      color: 'black',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      dash: 'draw',
      size: 'm',
      text: edge.label || '',
    },
    meta: {
      mindMapEdge: true,
      mindMapEdgeId: edge.id,
    },
  });

  // 将箭头移到底层
  editor.sendToBack([arrowId]);
}

/**
 * 获取图形的中心点
 */
function getShapeCenter(editor: Editor, shape: any): { x: number; y: number } {
  const bounds = editor.getShapePageBounds(shape);
  if (!bounds) {
    return { x: shape.x, y: shape.y };
  }

  return {
    x: bounds.x + bounds.w / 2,
    y: bounds.y + bounds.h / 2,
  };
}

/**
 * 清除画布上之前的思维图谱
 */
function clearPreviousMindMap(editor: Editor): void {
  const shapes = editor.getCurrentPageShapes();
  const mindMapShapes = shapes.filter(
    (shape) => shape.meta?.mindMapNode === true || shape.meta?.mindMapEdge === true,
  );

  if (mindMapShapes.length > 0) {
    editor.deleteShapes(mindMapShapes.map((s) => s.id));
  }
}

/**
 * 更新思维图谱节点
 */
export function updateMindMapNode(
  editor: Editor,
  nodeId: string,
  updates: Partial<MindMapNode>,
): void {
  const shapes = editor.getCurrentPageShapes();
  const shape = shapes.find((s) => s.meta?.mindMapNodeId === nodeId);

  if (!shape) {
    console.warn(`Mind map node not found: ${nodeId}`);
    return;
  }

  // 更新节点文本
  if (updates.label || updates.description !== undefined) {
    const currentMeta = shape.meta as any;
    const nodeType = currentMeta.mindMapNodeType as MindMapNode['type'];
    const typeLabel = NODE_TYPE_LABELS[nodeType];

    let text = `【${typeLabel}】\n${updates.label || shape.props.text}`;
    if (updates.description) {
      text += `\n\n${updates.description}`;
    }

    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        text,
      },
    });
  }
}
