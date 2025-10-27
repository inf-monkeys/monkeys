import {
  BindingOnChangeOptions,
  BindingOnCreateOptions,
  BindingOnDeleteOptions,
  BindingOnShapeDeleteOptions,
  BindingOnShapeIsolateOptions,
  BindingUtil,
  createComputedCache,
  Editor,
  T,
  TLBaseBinding,
  TLShapeId,
} from 'tldraw'
import { getWorkflowNodePorts } from '../nodePorts'

export type ConnectionBinding = TLBaseBinding<'connection', {
  portId: string
  terminal: 'start' | 'end'
}>

export class ConnectionBindingUtil extends BindingUtil<ConnectionBinding> {
  static override type = 'connection' as const
  static override props = {
    portId: T.string,
    terminal: T.literalEnum('start', 'end'),
  }

  override getDefaultProps() { return {} }

  onBeforeIsolateToShape({ binding }: BindingOnShapeIsolateOptions<ConnectionBinding>): void {
    this.editor.deleteShapes([binding.fromId])
  }
  onBeforeDeleteToShape({ binding }: BindingOnShapeDeleteOptions<ConnectionBinding>): void {
    this.editor.deleteShapes([binding.fromId])
  }

  // hooks for connect / disconnect are optional for now
  onAfterCreate(_opts: BindingOnCreateOptions<ConnectionBinding>): void {}
  onAfterDelete(_opts: BindingOnDeleteOptions<ConnectionBinding>): void {}
  onAfterChange(_opts: BindingOnChangeOptions<ConnectionBinding>): void {}
}

export interface ConnectionBindings { start?: ConnectionBinding; end?: ConnectionBinding }

export function getConnectionBindings(editor: Editor, shape: TLShapeId | { id: TLShapeId }): ConnectionBindings {
  const id = typeof shape === 'string' ? shape : shape.id
  return connectionBindingsCache.get(editor, id) ?? {}
}

const connectionBindingsCache = createComputedCache(
  'wf-connection bindings',
  (editor: Editor, connectionId: TLShapeId) => {
    const bindings = editor.getBindingsFromShape<ConnectionBinding>(connectionId, 'connection')
    let start: ConnectionBinding | undefined
    let end: ConnectionBinding | undefined
    for (const b of bindings) {
      if (b.props.terminal === 'start') start = b
      else if (b.props.terminal === 'end') end = b
    }
    return { start, end }
  },
  {
    areRecordsEqual: (a, b) => a === b,
    areResultsEqual: (a, b) => a.start === b.start && a.end === b.end,
  }
)

export function getConnectionBindingPositionInPageSpace(editor: Editor, binding: ConnectionBinding) {
  const target = editor.getShape(binding.toId)
  if (!target || target.type !== 'wf-node') return null
  const port = getWorkflowNodePorts(editor, target)?.[binding.props.portId]
  if (!port) return null
  return editor.getShapePageTransform(target).applyToPoint(port)
}

export function createOrUpdateConnectionBinding(
  editor: Editor,
  connection: TLShapeId | { id: TLShapeId },
  target: TLShapeId | { id: TLShapeId },
  props: ConnectionBinding['props']
) {
  const connectionId = typeof connection === 'string' ? connection : connection.id
  const targetId = typeof target === 'string' ? target : target.id
  const existingMany = editor
    .getBindingsFromShape<ConnectionBinding>(connectionId, 'connection')
    .filter((b) => b.props.terminal === props.terminal)
  if (existingMany.length > 1) editor.deleteBindings(existingMany.slice(1))
  const existing = existingMany[0]
  if (existing) {
    editor.updateBinding({ ...existing, toId: targetId, props })
  } else {
    editor.createBinding({ type: 'connection', fromId: connectionId, toId: targetId, props })
  }
}

export function removeConnectionBinding(editor: Editor, connection: TLShapeId | { id: TLShapeId }, terminal: 'start' | 'end') {
  const connectionId = typeof connection === 'string' ? connection : connection.id
  const existing = editor.getBindingsFromShape<ConnectionBinding>(connectionId, 'connection').filter((b) => b.props.terminal === terminal)
  editor.deleteBindings(existing)
}



