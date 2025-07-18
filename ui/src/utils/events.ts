import EventEmitter from 'eventemitter3';

export type AppEventType =
  | 'vines-logout'
  | 'vines-update-site-title'
  | 'vines-nav'
  | 'vines-trigger-init-icons'
  | 'vines-optimize-image';

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
  | 'flow-input-widgets'
  | 'flow-trigger-selector'
  | 'flow-trigger-schedule'
  | 'flow-trigger-webhook'
  | 'flow-trigger-custom'
  | 'flow-association-editor'
  | 'design-association-editor';

export type DesignBoardEventType = 'design-board-export' | 'design-board-save';

export type FromEventType = 'form-fill-data-by-image-url';

export type ViewEventType = 'view-toggle-active-view-by-workflow-id';

export type EventType =
  | AppEventType
  | FlowCanvasEventType
  | FlowEventType
  | FromEventType
  | ViewEventType
  | DesignBoardEventType;

const VinesEvent = new EventEmitter<EventType>();

export default VinesEvent;
