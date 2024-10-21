import { isObject, merge, reduce } from 'lodash';

type FlattenedObject = Record<string, any>;

export const flattenKeys = (
  obj: unknown,
  path: string[] = [],
  triggerKeys?: string[],
  triggerCallback?: (key: string, data: any) => void,
): FlattenedObject =>
  isObject(obj)
    ? reduce(
        obj,
        (cum: FlattenedObject, next: unknown, key: string) => {
          if (triggerKeys) {
            if (triggerKeys.includes(key)) {
              triggerCallback?.(key, obj[key]);
            }
          }
          return merge(cum, flattenKeys(next, [...path, key], triggerKeys, triggerCallback));
        },
        {},
      )
    : { [path.join('.')]: obj };
