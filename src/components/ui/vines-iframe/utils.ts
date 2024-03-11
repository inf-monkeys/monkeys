import React, { createElement } from 'react';

import { StoreApi } from 'zustand';

export const withProviders =
  <S extends StoreApi<unknown>>(
    Component: React.FC,
    ...providers: [
      ({
        createStore,
        children,
      }: {
        createStore: () => S;
        children: React.ReactNode;
      }) => React.FunctionComponentElement<React.ProviderProps<S | undefined>>,
      () => S,
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
