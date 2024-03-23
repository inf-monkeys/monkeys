import React, { createElement } from 'react';

import { StoreApi } from 'zustand';

export const withProviders =
  (
    Component: React.FC,
    ...providers: [
      ({
        createStore,
        children,
      }: {
        createStore: () => any;
        children: React.ReactNode;
      }) => React.FunctionComponentElement<React.ProviderProps<any | undefined>>,
      () => StoreApi<unknown>,
    ][]
  ) =>
  (props: React.Attributes | null | undefined) => {
    let ComponentWithProviders: React.ReactNode = createElement(Component, props);
    providers.forEach(
      ([it, createStore]) =>
        // eslint-disable-next-line react/no-children-prop
        (ComponentWithProviders = createElement(it, { createStore, children: ComponentWithProviders })),
    );
    return ComponentWithProviders;
  };
