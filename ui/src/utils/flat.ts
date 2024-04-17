import { isObject, merge, reduce } from 'lodash';

type FlattenedObject = Record<string, any>;

export const flattenKeys = (obj: unknown, path: string[] = []): FlattenedObject =>
  !isObject(obj)
    ? { [path.join('.')]: obj }
    : reduce(
        obj,
        (cum: FlattenedObject, next: unknown, key: string) => merge(cum, flattenKeys(next, [...path, key])),
        {},
      );
