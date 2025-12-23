import type { MonkeyWorkflow, ToolProperty } from '@inf-monkeys/monkeys';

import type { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import type { IVinesExecutionResultItem } from '@/utils/execution';

export type OutputSelectionKind = 'none' | 'mixed' | 'image' | 'video' | 'text' | 'json' | 'empty';

export const getOutputSelectionKind = (items: IVinesExecutionResultItem[]): OutputSelectionKind => {
  if (!items.length) return 'none';
  const kinds = new Set(items.map((it) => it.render.type));
  if (kinds.size !== 1) return 'mixed';
  return items[0].render.type;
};

const getRootVarName = (path: string): string => {
  const match = /^[^.[\]]+/.exec(path.trim());
  return match?.[0] ?? path.trim();
};

const normalizeAcceptList = (accept: unknown): string[] => {
  if (typeof accept !== 'string') return [];
  return accept
    .split(',')
    .map((it) => it.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
};

const isImageFileVariable = (variable?: ToolProperty): boolean => {
  if (!variable) return false;
  if (variable.type !== 'file') return false;

  const acceptList = normalizeAcceptList(variable.typeOptions?.accept);
  if (!acceptList.length) return true;

  return acceptList.some(
    (it) =>
      it.includes('image/') ||
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(it.replace(/^\./, '')),
  );
};

const isTextVariable = (variable?: ToolProperty): boolean => {
  return variable?.type === 'string';
};

const getWorkflowVariableByTargetPath = (workflow: MonkeyWorkflow | undefined, targetPath: string) => {
  const root = getRootVarName(targetPath);
  return workflow?.variables?.find((v) => v.name === root);
};

const getValueMappings = (association: IWorkflowAssociation) => {
  if (association.type !== 'to-workflow') return [];
  return association.mapper.filter((m) => /^__value(\[|$)/.test(m.origin.trim()));
};

const supportsMultiSelectionByMapper = (
  association: IWorkflowAssociation,
  selectionCount: number,
  targetWorkflow?: MonkeyWorkflow,
): boolean => {
  if (selectionCount <= 1) return true;
  if (association.type !== 'to-workflow') return true;

  const valueMappings = getValueMappings(association);
  if (!valueMappings.length) return false;

  const indexed = new Set<number>();
  for (const m of valueMappings) {
    const match = /^__value\[(\d+)\]/.exec(m.origin.trim());
    if (match) indexed.add(Number(match[1]));
  }

  if (indexed.size) {
    for (let i = 0; i < selectionCount; i++) {
      if (!indexed.has(i)) return false;
    }
    return true;
  }

  // Origin is "__value" (array) -> require at least one mapped target variable supports multiple values.
  for (const m of valueMappings) {
    const variable = getWorkflowVariableByTargetPath(targetWorkflow, m.target);
    if (variable?.typeOptions?.multipleValues) return true;
  }

  return false;
};

const supportsSelectionKind = (
  association: IWorkflowAssociation,
  selectionKind: OutputSelectionKind,
  targetWorkflow?: MonkeyWorkflow,
): boolean => {
  if (selectionKind === 'none') return true;
  if (selectionKind === 'mixed') return false;

  if (association.type === 'new-design') {
    return selectionKind === 'image';
  }

  const valueMappings = getValueMappings(association);
  if (!valueMappings.length) return false;

  if (selectionKind === 'image' || selectionKind === 'video') {
    return valueMappings.some((m) => isImageFileVariable(getWorkflowVariableByTargetPath(targetWorkflow, m.target)));
  }

  if (selectionKind === 'text') {
    return valueMappings.some((m) => isTextVariable(getWorkflowVariableByTargetPath(targetWorkflow, m.target)));
  }

  // json / empty: keep conservative (do not show).
  return false;
};

export const isAssociationCompatibleWithSelection = ({
  association,
  selectedItems,
  targetWorkflow,
}: {
  association: IWorkflowAssociation;
  selectedItems: IVinesExecutionResultItem[];
  targetWorkflow?: MonkeyWorkflow;
}): boolean => {
  if (!selectedItems.length) return true;

  const selectionKind = getOutputSelectionKind(selectedItems);
  if (!supportsSelectionKind(association, selectionKind, targetWorkflow)) return false;

  return supportsMultiSelectionByMapper(association, selectedItems.length, targetWorkflow);
};

export const buildAssociationOriginData = (selectedItems: IVinesExecutionResultItem[]) => {
  const first = selectedItems[0];
  if (!first) return {};

  if (selectedItems.length === 1) {
    return {
      ...first.rawOutput,
      __value: first.render.data,
    };
  }

  return {
    ...first.rawOutput,
    __value: selectedItems.map((it) => it.render.data),
    __values: selectedItems.map((it) => it.render.data),
    __items: selectedItems.map((it) => ({
      instanceId: it.instanceId,
      workflowId: it.workflowId,
      taskId: it.taskId,
      rawOutput: it.rawOutput,
      render: it.render,
    })),
  };
};
