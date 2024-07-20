// ref: https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-force-update/use-force-update.ts
import { useReducer } from 'react';

const reducer = (value: number) => (value + 1) % 1000000;

export function useForceUpdate(): () => void {
  const [, update] = useReducer(reducer, 0);
  return update;
}
