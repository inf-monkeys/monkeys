// 导出所有自定义形状和工具
export type { InstructionInputMode, InstructionShape, OutputShape } from './instruction/InstructionShape.types';
export { InstructionShapeUtil } from './instruction/InstructionShapeUtil';
export { OutputShapeUtil } from './output/OutputShapeUtil';
export { InstructionTool, OutputTool } from './tools/InstructionTool';
export { NodeTool } from './tools/NodeTool';
export { WorkflowTool } from './tools/WorkflowTool';
export type { WorkflowShape } from './workflow/WorkflowShape.types';
export { WorkflowShapeUtil } from './workflow/WorkflowShapeUtil';

// 导出 Workflow 节点系统 (来自 workflow-examples)
export type { ConnectionBinding as WorkflowConnectionBinding } from '../workflow-examples/src/connection/ConnectionBindingUtil';
export { ConnectionBindingUtil as WorkflowConnectionBindingUtil } from '../workflow-examples/src/connection/ConnectionBindingUtil';
export type { ConnectionShape as WorkflowConnectionShape } from '../workflow-examples/src/connection/ConnectionShapeUtil';
export { ConnectionShapeUtil as WorkflowConnectionShapeUtil } from '../workflow-examples/src/connection/ConnectionShapeUtil';
export type { NodeShape } from '../workflow-examples/src/nodes/NodeShapeUtil';
export { NodeShapeUtil } from '../workflow-examples/src/nodes/NodeShapeUtil';
