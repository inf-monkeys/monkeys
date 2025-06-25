/**
 * 统一的可见性条件评估函数
 * @param fieldValue 字段当前值
 * @param operator 比较操作符
 * @param expectedValue 期望值
 * @returns 是否满足条件
 */
export const evaluateVisibilityCondition = (fieldValue: any, operator: string, expectedValue: any): boolean => {
  // 处理空值情况
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return operator === 'isNot' ? expectedValue !== fieldValue : false;
  }

  switch (operator) {
    case 'is':
      return fieldValue === expectedValue;
    case 'isNot':
      return fieldValue !== expectedValue;
    case 'isGreaterThan':
      return Number(fieldValue) > Number(expectedValue);
    case 'isLessThan':
      return Number(fieldValue) < Number(expectedValue);
    case 'isGreaterThanOrEqual':
      return Number(fieldValue) >= Number(expectedValue);
    case 'isLessThanOrEqual':
      return Number(fieldValue) <= Number(expectedValue);
    default:
      // 默认回退到相等比较
      return fieldValue === expectedValue;
  }
};

/**
 * 根据字段类型获取可用的操作符
 * @param fieldType 字段类型
 * @returns 可用操作符数组
 */
export const getAvailableOperators = (fieldType: string): string[] => {
  const baseOperators = ['is', 'isNot'];
  const numberOperators = ['isGreaterThan', 'isLessThan', 'isGreaterThanOrEqual', 'isLessThanOrEqual'];

  return fieldType === 'number' ? [...baseOperators, ...numberOperators] : baseOperators;
};
