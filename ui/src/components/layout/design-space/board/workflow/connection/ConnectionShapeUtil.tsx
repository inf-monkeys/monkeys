import React from 'react'
import classNames from 'classnames'
import {
  CubicBezier2d,
  Editor,
  IndexKey,
  Mat,
  RecordProps,
  SVGContainer,
  ShapeUtil,
  TLBaseShape,
  TLHandle,
  TLHandleDragInfo,
  Vec,
  VecLike,
  vecModelValidator,
} from 'tldraw'
import { getPortAtPoint } from '../ports/getPortAtPoint.ts'
import { updatePortState } from '../ports/portState'
import { createOrUpdateConnectionBinding, getConnectionBindingPositionInPageSpace, getConnectionBindings, removeConnectionBinding } from './ConnectionBindingUtil'

export type ConnectionShape = TLBaseShape<'wf-connection', { start: { x: number; y: number }; end: { x: number; y: number } }>

export class ConnectionShapeUtil extends ShapeUtil<ConnectionShape> {
  static override type = 'wf-connection' as const
  static override props: RecordProps<ConnectionShape> = {
    start: vecModelValidator,
    end: vecModelValidator,
  }

  getDefaultProps(): ConnectionShape['props'] { return { start: { x: 0, y: 0 }, end: { x: 100, y: 100 } } }
  override canEdit() { return false }
  override canResize() { return false }
  override hideResizeHandles() { return true }
  override hideRotateHandle() { return true }
  override hideSelectionBoundsBg() { return true }
  override hideSelectionBoundsFg() { return true }
  override canSnap() { return false }
  override getBoundsSnapGeometry() { return { points: [] } }

  getGeometry(connection: ConnectionShape) {
    const { start, end } = getConnectionTerminals(this.editor, connection)
    const [cp1, cp2] = getConnectionControlPoints(start, end)
    return new CubicBezier2d({ start: Vec.From(start), cp1: Vec.From(cp1), cp2: Vec.From(cp2), end: Vec.From(end) })
  }

  getHandles(connection: ConnectionShape): TLHandle[] {
    const { start, end } = getConnectionTerminals(this.editor, connection)
    return [
      { id: 'start', type: 'vertex', index: 'a0' as IndexKey, x: start.x, y: start.y },
      { id: 'end', type: 'vertex', index: 'a1' as IndexKey, x: end.x, y: end.y },
    ]
  }

  onHandleDrag(connection: ConnectionShape, { handle }: TLHandleDragInfo<ConnectionShape>) {
    const draggingTerminal = handle.id as 'start' | 'end'
    const shapeTransform = this.editor.getShapePageTransform(connection)
    const handlePagePosition = shapeTransform.applyToPoint(handle)
    const target = getPortAtPoint(this.editor, handlePagePosition, { terminal: handle.id as any, margin: 8 })

    updatePortState(this.editor, { eligiblePorts: { terminal: draggingTerminal, excludeNodes: null } })

    if (!target) {
      updatePortState(this.editor, { hintingPort: null })
      removeConnectionBinding(this.editor, connection, draggingTerminal)
      return { ...connection, props: { [handle.id]: { x: handle.x, y: handle.y } } as any }
    }

    updatePortState(this.editor, { hintingPort: { portId: (target as any).port.id, shapeId: (target as any).shape.id } })
    createOrUpdateConnectionBinding(this.editor, connection, (target as any).shape, { portId: (target as any).port.id, terminal: draggingTerminal })
    return connection
  }

  onHandleDragEnd() { updatePortState(this.editor, { hintingPort: null, eligiblePorts: null }) }
  onHandleDragCancel() { updatePortState(this.editor, { hintingPort: null, eligiblePorts: null }) }

  component(connection: ConnectionShape) { return <ConnectionPath connection={connection} /> }
  indicator(connection: ConnectionShape) {
    const { start, end } = getConnectionTerminals(this.editor, connection)
    return (
      <g className="ConnectionShapeIndicator">
        <path d={getConnectionPath(start, end)} strokeWidth={2.1} strokeLinecap="round" />
      </g>
    )
  }
}

function ConnectionPath({ connection }: { connection: ConnectionShape }) {
  const editor = (Editor as any).useEditor?.() || (React as any).useContext((Editor as any).context)
  const { start, end } = editor.useValue('terminals', () => getConnectionTerminals(editor, connection), [editor, connection])
  return (
    <SVGContainer className={classNames('ConnectionShape')}>
      <path d={getConnectionPath(start, end)} />
    </SVGContainer>
  )
}

function getConnectionControlPoints(start: VecLike, end: VecLike): [Vec, Vec] {
  const distance = end.x - start.x
  const adjustedDistance = Math.max(30, distance > 0 ? distance / 3 : Math.min(Math.abs(distance) + 30, 100))
  return [new Vec(start.x + adjustedDistance, start.y), new Vec(end.x - adjustedDistance, end.y)]
}
function getConnectionPath(start: VecLike, end: VecLike) {
  const [cp1, cp2] = getConnectionControlPoints(start, end)
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y}`
}
export function getConnectionTerminals(editor: Editor, connection: ConnectionShape) {
  let start, end
  const bindings = getConnectionBindings(editor, connection)
  const shapeTransform = Mat.Inverse(editor.getShapePageTransform(connection))
  if (bindings.start) {
    const p = getConnectionBindingPositionInPageSpace(editor, bindings.start)
    if (p) start = Mat.applyToPoint(shapeTransform, p)
  }
  if (bindings.end) {
    const p = getConnectionBindingPositionInPageSpace(editor, bindings.end)
    if (p) end = Mat.applyToPoint(shapeTransform, p)
  }
  if (!start) start = connection.props.start
  if (!end) end = connection.props.end
  return { start, end }
}


