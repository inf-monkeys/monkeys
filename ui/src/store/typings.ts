import { StateCreator } from 'zustand';

export type ImmerStateCreator<T> = StateCreator<T, [['zustand/immer', never], never], [], T>;
