export const transformApiNumberValue = (obj: any) => {
  const { value } = obj;
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const intValue = parseInt(value);
    if (isNaN(intValue)) {
      throw new Error(`Invalid number value received: ${value}`);
    } else {
      return intValue;
    }
  } else {
    throw new Error(`Invalid number value received: ${value}`);
  }
};

export const transformGetApiBooleanValue = (obj: any) => {
  const { value } = obj;

  if (typeof value === 'boolean') {
    return value;
  }
  const validValues = ['true', 'false', '1', '0', 'True', 'False'];
  if (!validValues.includes(value)) {
    throw new Error(`Invalid boolean value received: ${value}`);
  }
  return ['true', '1', 'True'].includes(value);
};
