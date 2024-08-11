import { get } from 'lodash';

import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import type { TaskDefTypes } from '@/package/vines-flow/share/types.ts';

export const getPropertyValueFromTask = (
  def: VinesToolDefProperties,
  task?: TaskDefTypes,
  useInputParameters = true,
) => {
  const { name } = def;

  const inputParams = get(task, 'inputParameters', {});
  const getProps = get(inputParams, name);

  return useInputParameters ? getProps : getProps || get(task || {}, name);
};

type Conditions = Record<string, unknown[]>;
type Values = Record<string, unknown>;

const evaluateConditions = (conditions: Conditions, values: Values): boolean => {
  const conditionEntries = Object.entries(conditions);

  return conditionEntries.every(([key, conditionValues]) => {
    const value = values[key];
    return conditionValues.some((conditionValue) => {
      const specialCase = conditionValue === false && value === undefined;
      return specialCase || conditionValue === value;
    });
  });
};

export const calculateDisplayInputs = (defs: VinesToolDefProperties[], values: Values): VinesToolDefProperties[] => {
  return defs.filter((property) => {
    const { displayOptions } = property;
    if (!displayOptions) {
      return true;
    }
    const { show, hide } = displayOptions;

    let shouldBeDisplayed = false;
    if (show) {
      if (evaluateConditions(show as Conditions, values)) {
        shouldBeDisplayed = true;
      }
    }
    if (hide) {
      if (evaluateConditions(hide as Conditions, values)) {
        shouldBeDisplayed = false;
      }
    }
    return shouldBeDisplayed;
  });
};
