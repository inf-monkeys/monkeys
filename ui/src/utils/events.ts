import EventEmitter from 'eventemitter3';

export type AppEventType = 'vines-logout' | 'vines-update-site-title' | 'vines-updater';

export type FlowCanvasEventType =
  | 'canvas-zoom-in'
  | 'canvas-zoom-out'
  | 'canvas-auto-zoom'
  | 'canvas-zoom-to-node'
  | 'canvas-zoom-to'
  | 'canvas-context-menu';

export type FlowEventType =
  | 'flow-select-nodes'
  | 'flow-tool-editor'
  | 'flow-delete-node'
  | 'flow-start-tool'
  | 'flow-end-tool'
  | 'flow-raw-data-editor'
  | 'flow-variable-selector'
  | 'flow-input-editor'
  | 'flow-trigger-selector'
  | 'flow-trigger-schedule'
  | 'flow-trigger-webhook'
  | 'flow-trigger-custom';

export type EventType = AppEventType | FlowCanvasEventType | FlowEventType;

const VinesEvent = new EventEmitter<EventType>();

export default VinesEvent;
