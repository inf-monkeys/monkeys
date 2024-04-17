interface Options {
  cmp?: (a: any, b: any) => number;
  cycles?: boolean;
}

type INode = Record<string, any>;

export const stringify = (data: any, opts?: Options): string => {
  if (!opts) opts = {};

  if (typeof opts === 'function') opts = { cmp: opts };

  const cycles = typeof opts.cycles === 'boolean' ? opts.cycles : false;

  const cmp =
    opts.cmp &&
    (
      (f) =>
      (node: INode) =>
      (a: string, b: string): number => {
        const aObj = { key: a, value: node[a] };
        const bObj = { key: b, value: node[b] };
        return f(aObj, bObj);
      }
    )(opts.cmp);

  const seen: INode[] = [];

  const stringifyNode = (node: any): string | undefined => {
    // 如果节点具有 toJSON 方法，则将其转换为 JSON 对象
    if (node && node.toJSON && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }

    if (node === undefined) return;

    if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';

    if (typeof node !== 'object') return JSON.stringify(node);

    let out = '';

    if (Array.isArray(node)) {
      out = '[';
      for (let i = 0; i < node.length; i++) {
        if (i) out += ',';
        out += stringifyNode(node[i]) || 'null';
      }
      return out + ']';
    }

    if (node === null) return 'null';

    if (seen.indexOf(node) !== -1) {
      if (cycles) return JSON.stringify('__cycle__');

      throw new TypeError('Converting circular structure to JSON');
    }

    const seenIndex = seen.push(node) - 1;
    const keys = Object.keys(node).sort(cmp && cmp(node));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = stringifyNode(node[key]);
      if (!value) continue;
      if (out) out += ',';
      out += JSON.stringify(key) + ':' + value;
    }
    seen.splice(seenIndex, 1);
    return '{' + out + '}';
  };
  return stringifyNode(data) || '';
};
