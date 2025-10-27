import { Editor, TLShapeId } from 'tldraw'
import { WorkflowNodeShape } from './WorkflowNodeShapeUtil'

export function getWorkflowNodePorts(editor: Editor, shape: WorkflowNodeShape | TLShapeId | string) {
  const node = (typeof shape === 'string'
    ? (editor.getShape(shape as TLShapeId) as WorkflowNodeShape | null)
    : (shape as WorkflowNodeShape))
  const items = node?.props?.items ?? [0, 0]
  const ports: Record<string, { id: string; x: number; y: number; terminal: 'start' | 'end' }> = {}
  const NODE_WIDTH = 235
  const HEADER_H = 40
  const ROW_H = 44
  ports['output'] = { id: 'output', x: NODE_WIDTH + 6, y: HEADER_H / 2, terminal: 'start' }
  const total = Math.max(2, items.length)
  for (let i = 0; i < total; i++) {
    ports[`item_${i + 1}`] = { id: `item_${i + 1}`, x: 0, y: HEADER_H + 4 + ROW_H * i + ROW_H / 2, terminal: 'end' }
  }
  return ports
}

// 连接信息（基于绑定）
export interface NodePortConnection {
  connectedShapeId: TLShapeId
  connectionId: TLShapeId
  terminal: 'start' | 'end'
  ownPortId: string
  connectedPortId: string
}

export function getNodePortConnections(editor: Editor, node: WorkflowNodeShape | string): NodePortConnection[] {
  const nodeId = (typeof node === 'string' ? (node as unknown as TLShapeId) : (node.id as TLShapeId))
  const bindings = editor.getBindingsToShape(nodeId, 'connection') as any[]
  const result: NodePortConnection[] = []
  for (const b of bindings) {
    const connectionId = b.fromId as TLShapeId
    const opposite = (editor.getBindingsFromShape(connectionId as TLShapeId, 'connection') as any[])
      .find((x) => x.props?.terminal !== b.props?.terminal)
    if (!opposite) continue
    result.push({
      connectedShapeId: opposite.toId,
      connectionId,
      terminal: b.props.terminal,
      ownPortId: b.props.portId,
      connectedPortId: opposite.props.portId,
    })
  }
  return result
}

export function getNodeInputPortValues(editor: Editor, node: WorkflowNodeShape | string): Record<string, { value: number; isOutOfDate: boolean }> {
  const values: Record<string, { value: number; isOutOfDate: boolean }> = {}
  for (const c of getNodePortConnections(editor, node)) {
    if (c.terminal !== 'end') continue
    const src = editor.getShape(c.connectedShapeId) as any
    if (!src || src.type !== 'wf-node') continue
    const v = Number(src.props?.lastResult ?? 0)
    values[c.ownPortId] = { value: Number.isFinite(v) ? v : 0, isOutOfDate: false }
  }
  return values
}




