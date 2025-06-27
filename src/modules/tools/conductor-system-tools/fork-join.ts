import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';
import { isObject } from 'lodash';

export default defineNode({
  type: ToolType.SIMPLE,
  name: 'construct_workflow_output',
  categories: ['process'],
  displayName: '组装数据',
  description: '组装数据',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [],
  output: [],
  extra: {
    estimateTime: 3,
  },

  hidden: true,
  handler: async (inputs: Record<string, any>) => {
    const result = { ...inputs };

    for (const key in inputs) {
      const value = inputs[key];
      if (isObject(value)) {
        const innerKeys = Object.keys(value);
        // Heuristic to detect if this is a JOIN task's output
        const isJoinOutput = innerKeys.length > 1 && innerKeys.every((ik) => isObject(value[ik]));
        if (isJoinOutput) {
          const merged = {};
          for (const innerKey in value) {
            const innerValue = value[innerKey];
            if (isObject(innerValue)) {
              for (const prop in innerValue) {
                if (merged[prop]) {
                  if (Array.isArray(merged[prop])) {
                    merged[prop].push(innerValue[prop]);
                  } else {
                    merged[prop] = [merged[prop], innerValue[prop]];
                  }
                } else {
                  merged[prop] = innerValue[prop];
                }
              }
            }
          }
          result[key] = merged; // Overwrite the original value with the merged one
        }
      }
    }

    return result;
  },
});
