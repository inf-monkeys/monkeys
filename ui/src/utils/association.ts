import _ from 'lodash';

import { getWorkflow } from '@/apis/workflow';

export type IVarMapper = {
  origin: string;
  target: string;
  default?: any;
};

export const getTargetInput = async ({
  workflowId,
  originData,
  mapper,
}: {
  workflowId: string;
  originData: Record<string, any>;
  mapper: IVarMapper[];
}) => {
  const targetWorkflow = await getWorkflow(workflowId);
  const targetInput = {};

  if (targetWorkflow?.variables) {
    for (const input of targetWorkflow.variables) {
      _.set(targetInput, input.name, input.default);
    }
  }

  for (const { origin, target, default: defaultVal } of mapper) {
    _.set(targetInput, target, _.get(originData, origin, defaultVal ?? null));
  }

  return targetInput;
};
