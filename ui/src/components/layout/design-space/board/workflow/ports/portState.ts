import { Editor } from 'tldraw'

export interface PortState {
  hintingPort: { shapeId: string; portId: string } | null
  eligiblePorts: { terminal: 'start' | 'end'; excludeNodes: Set<string> | null } | null
}

const map = new WeakMap<Editor, PortState>()

export function getPortState(editor: Editor): PortState {
  if (!map.has(editor)) map.set(editor, { hintingPort: null, eligiblePorts: null })
  return map.get(editor)!
}

export function updatePortState(editor: Editor, update: Partial<PortState>) {
  const prev = getPortState(editor)
  map.set(editor, { ...prev, ...update })
}




