import EventEmitter from 'eventemitter3';

export type AppEventType = 'vines-logout' | 'vines-update-site-title';

export type EventType = AppEventType;

const VinesEvent = new EventEmitter<EventType>();

export default VinesEvent;
