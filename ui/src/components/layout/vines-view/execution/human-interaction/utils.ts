import { flatMap, isObject, toPairs } from 'lodash';

export const objectToArray = (obj: Record<string, unknown>): Record<string, unknown>[] => {
  return flatMap(toPairs(obj), ([key, value]) => {
    if (isObject(value)) {
      return flatMap(objectToArray(value as unknown as Record<string, unknown>), (nestedPair) => ({
        key: `${key}.${nestedPair.key}`,
        value: nestedPair.value,
      }));
    }
    return { key, value };
  });
};
