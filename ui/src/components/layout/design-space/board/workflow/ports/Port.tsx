import React from 'react'
import { TLHandle, TLShapeId, useEditor, useValue } from 'tldraw'
import { getWorkflowNodePorts } from '../nodePorts'
import { getPortState } from './portState'
import { createOrUpdateConnectionBinding } from '../connection/ConnectionBindingUtil'

export function Port({ shapeId, portId }: { shapeId: TLShapeId; portId: string }) {
  const editor = useEditor()
  const port = useValue('wf-port', () => {
    const shape = editor.getShape(shapeId)
    if (!shape || shape.type !== 'wf-node') return null
    return getWorkflowNodePorts(editor, shape as any)?.[portId] as any
  }, [editor, shapeId, portId])
  if (!port) return null

  const state = getPortState(editor)
  const isHinting = state.hintingPort && state.hintingPort.shapeId === shapeId && state.hintingPort.portId === portId

  return (
    <div
      className="wf-port"
      style={{
        position: 'absolute',
        left: port.x - 6,
        top: port.y - 6,
        width: 12,
        height: 12,
        borderRadius: 6,
        background: '#fff',
        border: `2px solid ${isHinting ? '#2563eb' : '#94a3b8'}`,
        boxSizing: 'border-box',
        cursor: 'crosshair',
      }}
      onPointerDown={(e) => {
        // 不阻止默认，让拖拽可被内部状态机识别；仅阻止冒泡避免触发节点选中
        e.stopPropagation()
        // 1) 切到 select
        try { editor.setCurrentTool('select') } catch {}
        // 2) 创建连接并将当前端绑定到本端口
        const pagePt = editor.inputs.currentPagePoint
        const connectionId = (editor as any).createShapeId ? (editor as any).createShapeId() : `shape:${Date.now()}`
        editor.createShape({ type: 'wf-connection', id: connectionId as any, x: pagePt.x, y: pagePt.y, props: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } } as any })
        createOrUpdateConnectionBinding(editor as any, { id: connectionId } as any, { id: shapeId } as any, { portId, terminal: (port as any).terminal })
        // 3) 转入拖拽另一端的内置状态（dragging_handle）
        const draggingTerminal = ((port as any).terminal === 'start' ? 'end' : 'start') as 'start' | 'end'
        const handles = editor.getShapeHandles(connectionId as any) as TLHandle[] | undefined
        const handle = handles?.find((h) => h.id === draggingTerminal)
        if (handle) {
          // 使用编辑器 API 直接显式进入拖拽（某些版本可用）
          try {
            (editor as any).dispatch?.({ type: 'transition', id: 'select.dragging_handle', info: { target: 'handle', shape: editor.getShape(connectionId as any)!, handle, isCreating: true } })
          } catch {}
          const selectState: any = editor.getStateDescendant('select')
          if (selectState && typeof selectState.transition === 'function') {
            selectState.transition('dragging_handle', { target: 'handle', shape: editor.getShape(connectionId as any)!, handle, isCreating: true })
          }
        }
      }}
    />
  )
}


