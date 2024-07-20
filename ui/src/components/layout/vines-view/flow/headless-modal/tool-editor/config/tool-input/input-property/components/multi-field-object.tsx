import React, { useCallback, useEffect, useState } from 'react';

import { isEmpty, set } from 'lodash';
import { ClipboardCopyIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';

interface InputGroupValue {
  id: number;
  key: string;
  value: string;
}

export const MultiFieldObjectInput: React.FC<IVinesInputPropertyProps> = ({
  def,
  value,
  onChange,
  disabled,
  ...props
}) => {
  const { t } = useTranslation();
  const { default: defaultValue } = def ?? {};

  const { copy } = useCopy({ timeout: 500 });

  const [inputs, setInputs] = useState<InputGroupValue[]>(
    Object.keys(value || defaultValue || {})
      .sort()
      .map((key, index) => ({
        id: index,
        key,
        value: ((value as Record<string, unknown>) || defaultValue)[key] as string,
      })),
  );

  const handleDelete = useCallback(
    (index: number) => setInputs((prev) => prev.filter((_, i) => i !== index)),
    [setInputs],
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string, type: 'key' | 'value') =>
      setInputs((prev) => prev.map((it, i) => (i === index ? { ...it, [type]: newValue as string } : it))),
    [setInputs],
  );

  const handleAddInput = useCallback(() => {
    setInputs((prevInputs) => {
      const nextInputIndex = prevInputs.length + 1;
      return [...prevInputs, { id: nextInputIndex, value: '', key: `value${nextInputIndex}` }];
    });
  }, [setInputs]);

  useEffect(() => {
    const parsedResult: { [x: string]: string } = {};
    for (const { key, value: Value } of inputs) {
      set(parsedResult, key, Value);
    }
    onChange?.(parsedResult);
  }, [inputs]);

  return (
    <div className="flex flex-col gap-2 text-xs">
      {inputs.map((it, index) => {
        const hasKey = !isEmpty(it.key);
        return (
          <div key={index} className="flex items-center gap-2">
            <Input
              className="h-8 flex-[30%]"
              value={it.key}
              onChange={(val) => handleValueChange(index, val, 'key')}
              placeholder={t(
                'workspace.flow-view.headless-modal.tool-editor.input.comps.multi-field-object.placeholder',
              )}
              disabled={disabled}
            />
            <div key={it.key} className="relative h-full flex-[70%]">
              <StringInput
                value={it.value?.toString() || ''}
                onChange={(val) => handleValueChange(index, val as string, 'value')}
                def={def}
                disabled={disabled}
                {...props}
              />
            </div>
            {!disabled && (
              <>
                <Button icon={<TrashIcon />} onClick={() => handleDelete(index)} />
                <Tooltip content={hasKey ? `$.${it.key}` : ''}>
                  <Button icon={<ClipboardCopyIcon />} disabled={!hasKey} onClick={() => copy(`$.${it.key}`)} />
                </Tooltip>
              </>
            )}
          </div>
        );
      })}
      {!disabled && (
        <div className="flex w-full justify-center">
          <Button icon={<PlusIcon />} size="small" onClick={handleAddInput}>
            {t('workspace.flow-view.headless-modal.tool-editor.input.comps.multi-field-object.create-field')}
          </Button>
        </div>
      )}
    </div>
  );
};
