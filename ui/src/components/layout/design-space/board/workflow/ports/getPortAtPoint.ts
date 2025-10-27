import { Editor, Vec, VecLike } from 'tldraw'
import { getWorkflowNodePorts } from '../nodePorts'

export function getPortAtPoint(editor: Editor, point: VecLike, opts?: { terminal?: 'start' | 'end'; margin?: number }) {
  const shape = editor.getShapeAtPoint(point, { hitInside: true, filter: (s) => s.type === 'wf-node', ...opts })
  if (!shape || shape.type !== 'wf-node') return null
  const ports = getWorkflowNodePorts(editor, shape as any)
  if (!ports) return null
  const shapeTransform = editor.getShapePageTransform(shape)
  let best: any = null
  let bestDist = Infinity
  for (const port of Object.values(ports)) {
    if (opts?.terminal && (port as any).terminal !== opts.terminal) continue
    const p = shapeTransform.applyToPoint(port as any)
    const d = Vec.Dist(point, p)
    if (d < bestDist) { best = port; bestDist = d }
  }
  if (!best) return null
  return { shape, port: best, existingConnections: [] as any[] }
}




