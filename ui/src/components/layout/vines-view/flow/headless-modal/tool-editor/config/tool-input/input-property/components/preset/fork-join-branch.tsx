import React, { useEffect, useState } from 'react';

import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { ForkJoinNode } from '@/package/vines-flow/core/nodes';
import { IVinesToolPropertiesOption } from '@/package/vines-flow/core/tools/typings.ts';

export const ForkJoinBranchPresets: React.FC<IVinesInputPropertyProps & Omit<IVinesInputPresetProps, 'typeOptions'>> = (
  props,
) => {
  const { t } = useTranslation();

  const { value, onChange, disabled, nodeId } = props;

  const { vines } = useVinesFlow();
  const node = vines.getNodeById(nodeId) as ForkJoinNode | undefined;

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);

  useEffect(() => {
    if (node) {
      const branches = node.branches;
      const branchLength = branches.length;

      const opts = branches.map((_it, index) => ({ name: `分支 ${index + 1}`, value: index }));

      if (Array.isArray(value)) {
        void (
          !value.includes('all') &&
          onChange?.((value as string[])?.filter((it) => branchLength > Number(it) && !isNaN(Number(it))))
        );
        void (
          (value.length >= branchLength || !value.length) &&
          onChange?.(Array.from({ length: branchLength }, (_, i) => i))
        );
      }
      setOptions(opts);
    }
  }, [node]);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((it) => it !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const selectValue = isArray(value) ? value : [];

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            {t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.fork-join-branch.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {options.map((it) => (
            <DropdownMenuCheckboxItem
              checked={selectValue.includes(it.value as string)}
              onCheckedChange={() => handleSelect(it.value as string)}
              key={it.value as string}
            >
              {it.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        onClick={() => {
          if (!node) return;
          onChange?.(Array.from({ length: node.branches.length }, (_, i) => i));
        }}
        disabled={disabled}
      >
        {t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.fork-join-branch.all-branch')}
      </Button>
    </div>
  );
};
