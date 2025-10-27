import { createComputedCache, Editor } from 'tldraw'
import { WorkflowNodeShape } from './WorkflowNodeShapeUtil'

export function getWorkflowNodePorts(editor: Editor, shape: WorkflowNodeShape | string) {
  return portsCache.get(editor, typeof shape === 'string' ? shape : shape.id) ?? {}
}

const portsCache = createComputedCache('wf-ports', (editor: Editor, node: WorkflowNodeShape) => {
  const items = node.props.items
  const ports: Record<string, { id: string; x: number; y: number; terminal: 'start' | 'end' }> = {}
  const NODE_WIDTH = 235
  const HEADER_H = 40
  const ROW_H = 44
  ports['output'] = { id: 'output', x: NODE_WIDTH, y: HEADER_H / 2, terminal: 'start' }
  const total = Math.max(2, items.length)
  for (let i = 0; i < total; i++) {
    ports[`item_${i}`] = { id: `item_${i}`, x: 0, y: HEADER_H + 4 + ROW_H * i + ROW_H / 2, terminal: 'end' }
  }
  return ports
})




