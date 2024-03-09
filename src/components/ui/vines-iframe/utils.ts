import React, { createElement } from 'react';

import { StoreApi } from 'zustand';

export const withProviders = (
  Component: React.FC,
  ...providers: [
    ({
      createStore,
    }: {
      createStore: () => StoreApi<any>;
      children: React.ReactNode;
    }) => React.FunctionComponentElement<React.ProviderProps<ReturnType<any> | undefined>>,
    () => StoreApi<any>,
  ][]
) => {
  let ComponentWithProviders: React.ReactNode = createElement(Component);
  providers.forEach(
    ([it, createStore]) =>
      (ComponentWithProviders = createElement(it, { createStore, children: ComponentWithProviders })),
  );

  return () => ComponentWithProviders;
};
