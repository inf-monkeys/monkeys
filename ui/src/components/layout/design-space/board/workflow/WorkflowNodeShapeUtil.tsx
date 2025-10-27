import React from 'react'
import {
  Circle2d,
  Group2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLBaseShape,
  TLResizeInfo,
  useEditor,
} from 'tldraw'
import { Port } from './ports/Port'
import { NODE_ROW_HEADER_GAP_PX } from './constants'

type WorkflowNodeProps = {
  title: string
  items: number[]
  lastResult: number | null
}

export type WorkflowNodeShape = TLBaseShape<'wf-node', WorkflowNodeProps>

import { NODE_WIDTH_PX as NODE_WIDTH, NODE_HEADER_HEIGHT_PX as HEADER_H, NODE_ROW_HEIGHT_PX as ROW_H, PORT_RADIUS_PX as PORT_R } from './constants'

function getNodeHeight(items: number[]) {
  return HEADER_H + Math.max(2, items.length) * ROW_H + 10
}

export class WorkflowNodeShapeUtil extends ShapeUtil<WorkflowNodeShape> {
  static override type = 'wf-node' as const
  static override props: RecordProps<WorkflowNodeShape> = {
    title: T.string,
    items: T.arrayOf(T.number),
    lastResult: T.number.nullable(),
  }

  getDefaultProps(): WorkflowNodeShape['props'] {
    return { title: 'Add', items: [0, 0], lastResult: null }
  }

  override canResize() { return false }
  override hideResizeHandles() { return true }
  override hideRotateHandle() { return true }
  override hideSelectionBoundsFg() { return true }
  override hideSelectionBoundsBg() { return true }

  override getGeometry(shape: WorkflowNodeShape) {
    const h = getNodeHeight(shape.props.items)
    const body = new Rectangle2d({ width: NODE_WIDTH, height: h, isFilled: true })
    const ports: Circle2d[] = []
    // input ports on the left
    const total = Math.max(2, shape.props.items.length)
    for (let i = 0; i < total; i++) {
      const y = HEADER_H + ROW_H * i + ROW_H / 2
      // tldraw v3 Geometry2d 不支持 excludeFromShapeBounds 选项，保留 isLabel 以避免边框高亮干扰
      ports.push(new Circle2d({ x: -PORT_R, y: y - PORT_R, radius: PORT_R, isFilled: true, isLabel: true } as any))
    }
    // output port on the right (header center)
    ports.push(new Circle2d({ x: NODE_WIDTH - PORT_R, y: HEADER_H / 2 - PORT_R, radius: PORT_R, isFilled: true, isLabel: true } as any))
    return new Group2d({ children: [body, ...ports] })
  }

  override onResize(shape: any, info: TLResizeInfo<any>) {
    return shape
  }

  component(shape: WorkflowNodeShape) {
    return <WorkflowNodeComponent shape={shape} />
  }

  indicator(shape: WorkflowNodeShape) {
    const h = getNodeHeight(shape.props.items)
    return <rect rx={10} width={NODE_WIDTH} height={h} />
  }
}

function WorkflowNodeComponent({ shape }: { shape: WorkflowNodeShape }) {
  const editor = useEditor()
  const items = shape.props.items
  const h = getNodeHeight(items)

  const setItem = (idx: number, v: number) => {
    const arr = [...items]
    arr[idx] = v
    // ensure a trailing empty item
    const hasTrailingZero = arr[arr.length - 1] === 0
    const normalized = arr.filter((n, i) => i === 0 || i === arr.length - 1 || n !== 0)
    const next = hasTrailingZero ? normalized : [...normalized, 0]
    editor.updateShape<WorkflowNodeShape>({ id: shape.id, type: 'wf-node', props: { items: next } as any })
  }

  // 读取与本节点相连的前驱节点的输出（使用 tldraw 默认箭头绑定：end.boundShapeId === shape.id）
  const getInboundValues = (): number[] => {
    try {
      const pageShapes = editor.getCurrentPageShapes()
      const arrows = pageShapes.filter((s: any) => s.type === 'arrow') as any[]
      const inbound: Array<{ id: string; value: number }> = []
      for (const a of arrows) {
        const end = (a as any).props?.end
        const start = (a as any).props?.start
        const endBound = end && end.type === 'binding' && end.boundShapeId === shape.id
        const startBoundId = start && start.type === 'binding' ? start.boundShapeId : null
        if (endBound && startBoundId) {
          const src = editor.getShape(startBoundId) as any
          if (src?.type === 'wf-node') {
            const v = Number(src?.props?.lastResult ?? 0)
            if (Number.isFinite(v)) inbound.push({ id: String(a.id), value: v })
          }
        }
      }
      // 稳定排序，保证端口-值映射稳定
      inbound.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      return inbound.map((x) => x.value)
    } catch {
      return []
    }
  }

  const recompute = () => {
    const linked = getInboundValues()
    // 链接值放在前面，手动输入补在后面
    const manual = [...items]
    const restManual = manual.slice(linked.length)
    const merged = [...linked, ...restManual]
    const normalized = (() => {
      const arr = merged.length < 2 ? [...merged, 0] : merged
      return arr[arr.length - 1] === 0 ? arr : [...arr, 0]
    })()
    const sum = normalized.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)

    const sameItems = JSON.stringify(normalized) === JSON.stringify(items)
    if (!sameItems) {
      editor.updateShape<WorkflowNodeShape>({ id: shape.id, type: 'wf-node', props: { items: normalized, lastResult: sum } as any })
    } else {
      editor.updateShape<WorkflowNodeShape>({ id: shape.id, type: 'wf-node', props: { lastResult: sum } as any })
    }
  }

  // 监听文档变化，自动根据连线更新
  React.useEffect(() => {
    const unsub = editor.store.listen(() => {
      try { recompute() } catch {}
    }, { scope: 'document' })
    // 初次计算
    try { recompute() } catch {}
    return () => { unsub() }
  }, [editor, shape.id])

  return (
    <HTMLContainer style={{ width: NODE_WIDTH, height: h }}>
      <div style={{ width: NODE_WIDTH, height: h, borderRadius: 10, background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--color-panel-contrast-weak)' }}>
        <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: 600, borderBottom: '1px solid #eee' }}>
          <span style={{ flex: 1 }}>{shape.props.title}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>输出: {shape.props.lastResult ?? 0}</span>
        </div>
        <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {Array.from({ length: Math.max(2, items.length) }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: ROW_H }}>
              <span style={{ width: 40, color: '#475569', fontSize: 12 }}>输入{i + 1}</span>
              {/* 左侧输入端口 */}
              <div style={{ position: 'absolute', left: -18, top: 6 + NODE_ROW_HEADER_GAP_PX + ROW_H * i + ROW_H / 2 - 6 }}>
                <Port shapeId={shape.id} portId={`item_${i}`} />
              </div>
              <input
                type="number"
                defaultValue={items[i] ?? 0}
                onChange={(e) => setItem(i, Number(e.target.value) || 0)}
                onBlur={recompute}
                onKeyDown={(e) => { e.stopPropagation() }}
                onWheel={(e) => { e.stopPropagation() }}
                onPointerDown={(e) => { e.stopPropagation() }}
                onPointerUp={(e) => { e.stopPropagation() }}
                onClick={(e) => { e.stopPropagation() }}
                style={{ flex: 1, height: 22, border: '1px solid #e5e7eb', borderRadius: 6, padding: '0 8px', fontSize: 12 }}
              />
            </div>
          ))}
        </div>
      </div>
    </HTMLContainer>
  )
}


