import { BOOLEAN_VALUES } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { getI18nContent } from '@/utils';

import type { WorkflowInputParam } from './WorkflowShape.types';

function isNil(v: any) {
  return v === null || v === undefined;
}

function isPlainObject(v: any) {
  if (!v || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * tldraw 对 record props 的校验比 JSON.stringify 更严格：必须是“纯 JSON 值”。
 * 这里把常见的非 JSON 值（undefined、Date、Map/Set、BigInt、非 plain object、NaN/Infinity）做降级。
 */
export function toJsonSerializable(value: any): any {
  if (value === null) return null;

  const t = typeof value;
  if (t === 'string' || t === 'boolean') return value;
  if (t === 'number') return Number.isFinite(value) ? value : null;
  if (t === 'bigint') return value.toString();
  if (t === 'symbol' || t === 'function') return null;
  if (t === 'undefined') return null;

  // Array
  if (Array.isArray(value)) {
    return value.map((it) => {
      const v = toJsonSerializable(it);
      return v === undefined ? null : v;
    });
  }

  // Date
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  }

  // Map / Set
  if (value instanceof Map) {
    const obj: Record<string, any> = {};
    for (const [k, v] of value.entries()) {
      const key = typeof k === 'string' ? k : String(k);
      obj[key] = toJsonSerializable(v);
    }
    return obj;
  }
  if (value instanceof Set) {
    return Array.from(value.values()).map((it) => toJsonSerializable(it));
  }

  // Plain object
  if (isPlainObject(value)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue; // JSON 不允许 undefined
      out[k] = toJsonSerializable(v);
    }
    return out;
  }

  // 其他对象（类实例等）一律降级为 plain object（尽量保留可枚举字段）；失败则转字符串
  try {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = toJsonSerializable(v);
    }
    return out;
  } catch {
    try {
      return String(value);
    } catch {
      return null;
    }
  }
}

/**
 * 画板里的 Workflow 节点需要一个稳定、可序列化的 inputParams 结构。
 * 但后端/不同版本的 workflow variable schema 里：
 * - 默认值可能是 default / defaultValue / value
 * - 下拉选项可能在 typeOptions.selectList 或 selectList（旧结构）里
 * - multipleValues/assetType/min/max 等可能在 root 或 typeOptions 下
 *
 * 这里做一次归一化，保证“默认值 + 下拉选项”能正确带到画板。
 */
export function normalizeWorkflowInputParams(variables: any[] | undefined | null): WorkflowInputParam[] {
  const vars = Array.isArray(variables) ? variables : [];

  const initial = vars.map((variable: any) => {
    const rawTypeOptions = (variable?.typeOptions ?? {}) as Record<string, any>;

    const displayName = getI18nContent(variable?.displayName) || variable?.name || '';
    const description =
      getI18nContent(variable?.description) || getI18nContent(variable?.placeholder) || variable?.placeholder || '';

    // 默认值兼容：default / defaultValue / value
    const defaultValue = !isNil(variable?.default)
      ? variable.default
      : !isNil(variable?.defaultValue)
        ? variable.defaultValue
        : !isNil(variable?.value)
          ? variable.value
          : undefined;

    // 下拉选项兼容：typeOptions.selectList（主流）/ selectList（旧）/ typeOptions.options（旧）
    const selectList =
      (rawTypeOptions?.selectList ??
        variable?.selectList ??
        // 有些旧数据会直接用 options
        rawTypeOptions?.options ??
        []) as any[];

    const enableSelectList = Boolean(
      rawTypeOptions?.enableSelectList ?? variable?.enableSelectList ?? (Array.isArray(selectList) && selectList.length),
    );

    // 画板渲染只认 type === 'options' + typeOptions.options
    const isSelectField = enableSelectList && Array.isArray(selectList) && selectList.length > 0;

    const normalizedTypeOptions: Record<string, any> = {
      ...toJsonSerializable(rawTypeOptions),
      // 统一把常用字段铺平，供画板渲染/运行时读取
      multipleValues: Boolean(rawTypeOptions?.multipleValues ?? variable?.multipleValues),
      assetType: rawTypeOptions?.assetType ?? variable?.assetType,
      minValue: rawTypeOptions?.minValue ?? variable?.minValue,
      maxValue: rawTypeOptions?.maxValue ?? variable?.maxValue,
      numberPrecision: rawTypeOptions?.numberPrecision ?? variable?.numberPrecision,
      enableSelectList,
      selectList: toJsonSerializable(selectList),
    };

    if (isSelectField) {
      // 画板用最小结构渲染：{ value, label }
      // 注意：value 需要保持类型（string/number/boolean），这里额外保留 rawValue 以便调试/兼容
      normalizedTypeOptions.options = selectList.map((it: any) => ({
        name: it?.name,
        value: toJsonSerializable(it?.value),
        label: getI18nContent(it?.label) || String(it?.value ?? it?.name ?? ''),
      }));
    }

    const type = isSelectField ? 'options' : variable?.type || 'string';

    // 画板 props 不能写入 undefined（tldraw 会报 json serializable 错），用空值占位
    const safeValue =
      !isNil(defaultValue)
        ? toJsonSerializable(defaultValue)
        : type === 'boolean'
          ? false
          : type === 'number'
            ? ''
            : '';

    return {
      name: variable?.name || '',
      displayName,
      type,
      value: safeValue,
      required: Boolean(variable?.required),
      description,
      typeOptions: Object.keys(normalizedTypeOptions).length ? (toJsonSerializable(normalizedTypeOptions) as any) : undefined,
    };
  });

  // 兼容“下拉选项联动默认值”：当 selectList 的某个选项被设为默认（param.value），其 linkage 会把其它字段也写入默认值
  // 参考 workspace 表单默认值逻辑：form/tabular/render/index.tsx 中对 selectList.linkage 的处理
  const byName = new Map<string, WorkflowInputParam>();
  for (const p of initial) byName.set(p.name, p);

  const isEmptyValue = (v: any) => v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);

  const coerceByType = (target: WorkflowInputParam, raw: any) => {
    const multiple = Boolean((target as any)?.typeOptions?.multipleValues);

    if (target.type === 'number') {
      if (multiple) return (Array.isArray(raw) ? raw : raw ? [raw] : []).map((it) => Number(it));
      const n = Number(raw);
      return Number.isFinite(n) ? n : '';
    }

    if (target.type === 'boolean') {
      const toBool = (it: any) => (typeof it === 'boolean' ? it : BOOLEAN_VALUES.includes(String(it ?? '').toLowerCase()));
      if (multiple) return (Array.isArray(raw) ? raw : raw ? [raw] : []).map(toBool);
      return toBool(raw);
    }

    if (multiple) return Array.isArray(raw) ? raw : raw ? [raw] : [];
    return raw;
  };

  const equals = (a: any, b: any) => {
    if (a === b) return true;
    // 兼容 number/string 混用（例如 default=1, item.value="1"）
    return String(a ?? '') === String(b ?? '');
  };

  for (const p of initial) {
    const typeOptions: any = (p as any).typeOptions || {};
    if (!typeOptions?.enableSelectList) continue;
    const selectList: any[] = Array.isArray(typeOptions?.selectList) ? typeOptions.selectList : [];
    if (!selectList.length) continue;

    const selected = selectList.find((it) => equals(it?.value, p.value));
    const linkage: any[] = Array.isArray(selected?.linkage) ? selected.linkage : [];
    if (!linkage.length) continue;

    for (const link of linkage) {
      const targetName = String(link?.name ?? '');
      if (!targetName) continue;
      const target = byName.get(targetName);
      if (!target) continue;

      // 只在目标字段尚未有值时填充（避免覆盖用户输入 / 显式默认）
      if (!isEmptyValue(target.value)) continue;

      const nextVal = toJsonSerializable(coerceByType(target, link?.value));
      target.value = nextVal;
    }
  }

  return initial;
}


