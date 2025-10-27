import { createShapeId, StateNode, TLPointerEventInfo } from 'tldraw'
import { createOrUpdateConnectionBinding } from '../connection/ConnectionBindingUtil'

export class PointingPort extends StateNode {
  static override id = 'pointing_port'
  info?: { shapeId: string; portId: string; terminal: 'start' | 'end' }

  override onEnter(info: { shapeId: string; portId: string; terminal: 'start' | 'end' }) {
    this.info = info
  }

  override onPointerMove(info: TLPointerEventInfo) {
    if (!this.editor.inputs.isDragging) return
    const connectionId = createShapeId()
    const draggingTerminal = this.info!.terminal === 'start' ? 'end' : 'start'
    // 在页面坐标创建连接，起点/终点都以0,0开始
    this.editor.createShape({ type: 'wf-connection', id: connectionId, x: info.point.x, y: info.point.y, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } } as any })
    createOrUpdateConnectionBinding(this.editor, { id: connectionId } as any, { id: this.info!.shapeId } as any, { portId: this.info!.portId, terminal: this.info!.terminal })
    const handle = this.editor.getShapeHandles(connectionId)?.find((h) => h.id === draggingTerminal)
    this.parent.transition('dragging_handle', { ...info, target: 'handle', shape: this.editor.getShape(connectionId)!, handle: handle!, isCreating: true })
  }

  override onPointerUp(info: TLPointerEventInfo) {
    this.parent.transition('idle', info)
  }
}


