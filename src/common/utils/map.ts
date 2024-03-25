export function getMap<T>(arr: T[], keyGetter: (item: T) => string) {
  const hashmap: Record<string, T> = {};
  arr.forEach((item) => {
    const key = keyGetter(item);
    hashmap[key] = item;
  });
  return hashmap;
}

export function getListMap<T>(arr: T[], keyGetter: (item: T) => string) {
  const hashmap: Record<string, T[]> = {};
  arr.forEach((item) => {
    const key = keyGetter(item);
    if (!hashmap[key]) {
      hashmap[key] = [];
    }
    hashmap[key].push(item);
  });
  return hashmap;
}
