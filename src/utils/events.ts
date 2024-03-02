import EventEmitter from 'eventemitter3';

export type AppEventType = 'vines-logout';

export type EventType = AppEventType;

const eventBus = new EventEmitter<EventType>();

export default eventBus;
