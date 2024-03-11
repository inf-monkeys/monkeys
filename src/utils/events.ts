import EventEmitter from 'eventemitter3';

export type AppEventType = 'vines-logout' | 'vines-update-site-title';

export type FlowCanvasEventType =
  | 'canvas-zoom-in'
  | 'canvas-zoom-out'
  | 'canvas-auto-zoom'
  | 'canvas-zoom-to-node'
  | 'canvas-zoom-to'
  | 'canvas-context-menu';

export type FlowEventType = 'flow-select-nodes' | 'flow-tool-editor' | 'flow-delete-node';

export type EventType = AppEventType | FlowCanvasEventType | FlowEventType;

const VinesEvent = new EventEmitter<EventType>();

export default VinesEvent;
