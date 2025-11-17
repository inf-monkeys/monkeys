/**
 * Port definitions for Instruction, Output, and Workflow shapes
 */
import { Editor, TLShapeId } from 'tldraw';

import { ShapePort } from '../../workflow-examples/src/ports/Port';
import { InstructionShape, OutputShape } from '../instruction/InstructionShape.types';
import { WorkflowShape } from '../workflow/WorkflowShape.types';

/**
 * Get ports for an Instruction shape
 * Instruction has one output port on the right side
 */
export function getInstructionPorts(editor: Editor, shape: InstructionShape | TLShapeId): Record<string, ShapePort> {
  const instructionShape = typeof shape === 'string' ? (editor.getShape(shape) as InstructionShape | undefined) : shape;
  if (!instructionShape) return {};

  // Use shape props directly to avoid circular dependency with getGeometry
  const width = instructionShape.props.w;
  const height = instructionShape.props.h;
  const centerY = height / 2;

  return {
    output: {
      id: 'output',
      x: width, // Right side
      y: centerY,
      terminal: 'start', // Output port
    },
  };
}

/**
 * Get ports for an Output shape
 * Output has:
 * - One input port on the left side
 * - One output port on the right side (so it can be used as input for next workflow)
 */
export function getOutputPorts(editor: Editor, shape: OutputShape | TLShapeId): Record<string, ShapePort> {
  const outputShape = typeof shape === 'string' ? (editor.getShape(shape) as OutputShape | undefined) : shape;
  if (!outputShape) return {};

  // Use shape props directly to avoid circular dependency with getGeometry
  const width = outputShape.props.w;
  const height = outputShape.props.h;
  const centerY = height / 2;

  return {
    input: {
      id: 'input',
      x: 0, // Left side
      y: centerY,
      terminal: 'end', // Input port
    },
    output: {
      id: 'output',
      x: width, // Right side
      y: centerY,
      terminal: 'start', // Output port
    },
  };
}

/**
 * Get ports for a Workflow shape
 * Workflow has:
 * - Input ports on the left side for each parameter
 * - One output port on the right side
 */
export function getWorkflowPorts(editor: Editor, shape: WorkflowShape | TLShapeId): Record<string, ShapePort> {
  const workflowShape = typeof shape === 'string' ? (editor.getShape(shape) as WorkflowShape | undefined) : shape;
  if (!workflowShape) return {};

  // Use shape props directly to avoid circular dependency with getGeometry
  const width = workflowShape.props.w;
  const height = workflowShape.props.h;
  const ports: Record<string, ShapePort> = {};

  // Output port on the right side (center)
  ports.output = {
    id: 'output',
    x: width,
    y: height / 2,
    terminal: 'start',
  };

  // Input ports on the left side for each parameter
  const params = workflowShape.props.inputParams || [];

  if (params.length > 0) {
    // 精确计算端口位置，与实际 DOM 布局完全匹配
    // 布局结构分析：
    // 1. 标题栏: padding: '8px 12px' → 约40px高度
    // 2. 内容区域: padding: '12px 12px 12px 24px'
    // 3. 工作流名称: fontSize: '16px', marginBottom: '4px' → 约24px
    // 4. 工作流描述: fontSize: '12px', marginBottom: '8px' → 约20px (如果有描述)
    // 5. 参数区域: marginTop: '12px', paddingTop: '12px', borderTop
    // 6. "输入参数"标题: fontSize: '12px', marginBottom: '8px' → 约20px

    const headerBarHeight = 40; // 标题栏（Workflow + 播放按钮）
    const contentPaddingTop = 12; // 内容区域上padding
    const workflowNameHeight = 24; // 工作流名称
    const workflowDescHeight = workflowShape.props.workflowDescription ? 20 : 0; // 工作流描述（可选）
    const beforeParamsMargin = 12; // marginTop
    const beforeParamsPadding = 12; // paddingTop
    const paramsSectionTitleHeight = 20; // "输入参数"标题
    const paramsTitleMarginBottom = 8; // 标题下margin

    // 参数区域开始的 Y 坐标
    let currentY =
      headerBarHeight +
      contentPaddingTop +
      workflowNameHeight +
      workflowDescHeight +
      beforeParamsMargin +
      beforeParamsPadding +
      paramsSectionTitleHeight +
      paramsTitleMarginBottom;

    params.forEach((param, index) => {
      // 每个参数的结构：
      // - label: fontSize: '11px', marginBottom: '4px' → 约16px
      // - input/uploader: 高度根据类型变化
      // - marginBottom: '8px'

      const labelHeight = 16;
      const labelMarginBottom = 4;
      let inputHeight = 28; // 默认输入框高度（padding: 4px 8px + fontSize: 11px）
      const paramMarginBottom = 8;

      if (param.type === 'file') {
        // VinesUploader 高度: h-[12rem] = 192px
        inputHeight = 192;
      } else if (param.type === 'number' && param.typeOptions?.uiType === 'slider') {
        // 滑块组件：range input (24px) + marginTop (2px) + 值显示 (14px)
        inputHeight = 40;
      } else if (param.type === 'number') {
        // 数字输入框
        inputHeight = 28;
      } else {
        // 文本输入、选择框等
        inputHeight = 28;
      }

      // 端口应该在 label 的中间位置（与红箭头对齐）
      const portYPosition = currentY + labelHeight / 2;

      const portId = `param_${param.name}`;
      ports[portId] = {
        id: portId,
        x: 0, // Left side
        y: portYPosition,
        terminal: 'end', // Input port
      };

      // 移动到下一个参数
      currentY += labelHeight + labelMarginBottom + inputHeight + paramMarginBottom;
    });
  }

  return ports;
}

/**
 * Helper function to get ports for any supported shape type
 */
export function getShapePorts(
  editor: Editor,
  shape: InstructionShape | OutputShape | WorkflowShape | TLShapeId,
): Record<string, ShapePort> {
  let targetShape: InstructionShape | OutputShape | WorkflowShape | undefined;

  if (typeof shape === 'string') {
    const s = editor.getShape(shape);
    if (s && (s.type === 'instruction' || s.type === 'output' || s.type === 'workflow')) {
      targetShape = s as InstructionShape | OutputShape | WorkflowShape;
    }
  } else {
    targetShape = shape;
  }

  if (!targetShape) return {};

  switch (targetShape.type) {
    case 'instruction':
      return getInstructionPorts(editor, targetShape as InstructionShape);
    case 'output':
      return getOutputPorts(editor, targetShape as OutputShape);
    case 'workflow':
      return getWorkflowPorts(editor, targetShape as WorkflowShape);
    default:
      return {};
  }
}
