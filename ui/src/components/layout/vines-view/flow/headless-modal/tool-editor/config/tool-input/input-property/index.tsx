import React, { useCallback, useMemo, useState } from 'react';

import { BlockDefPropertyTypeOptions, BlockDefPropertyTypes } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { debounce, get, isEmpty, isNumber, isString } from 'lodash';
import { PresetInput } from 'src/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset';

import { BlankInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/blank.tsx';
import { BooleanInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/boolean.tsx';
import { CollectionInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/collection.tsx';
import { EditorInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/editor.tsx';
import { FileInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/file.tsx';
import { MultiFieldObjectInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/multi-field-object.tsx';
import { NoticeInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/notice.tsx';
import { NumberInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/number.tsx';
import { OptionsInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/options.tsx';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { InputPropertyWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/wrapper';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { IVinesVariableMap, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

import { QRCodeInput } from './components/qrcode';

export interface IVinesInputPropertyProps {
  toolName: string;
  def: VinesToolDefProperties;
  value: unknown;
  onChange: (value: unknown) => void;
  nodeId: string;
  variableMapper: Record<string, IVinesVariableMap>;
  disabled?: boolean;
  // 有些输入框比如 qrcode 可能是有状态的，需要传递自定义上下文（比如工作流 id、触发器 id）来确定二维码状态
  context?: { [x: string]: any };
}

export const VinesInputProperty: React.FC<IVinesInputPropertyProps> = (props) => {
  const { def, nodeId, disabled } = props;
  const { onChange, value, ...childProps } = props;
  const [type, typeOptions, isMultipleValues, enableEditor, isPureCollection, isMultiFieldObject, assetType] =
    useMemo(() => {
      const options = get(def, 'typeOptions', {}) as BlockDefPropertyTypeOptions;
      const type = get(def, 'type', 'string') as BlockDefPropertyTypes;
      const isMultipleValues = get(options, 'multipleValues', false);
      const isMultiFieldObject = get(options, 'multiFieldObject', false);
      const enableEditor = get(options, 'editor', null) === 'code' || (type === 'json' && !isMultiFieldObject);

      const isPureCollection =
        (['string', 'boolean', 'number', 'file'].includes(type) && isMultipleValues) || type === 'file';
      const assetType = get(options, 'assetType', null);

      return [type, options, isMultipleValues, enableEditor, isPureCollection, isMultiFieldObject, assetType];
    }, [def]);

  const [componentMode, setComponentMode] = useState<'component' | 'input'>('component');

  const hasValue = useMemo(() => {
    const isBooleanType = type === 'boolean';
    const hasBoolean =
      isBooleanType && Array.isArray(value)
        ? value
            .map((it) => it.toString())
            .filter((it) => ['true', 'false'].includes(it))
            .every((it) => ['true', 'false'].includes(it))
        : typeof value === 'boolean' || ['true', 'false'].includes(value?.toString() ?? '');
    const isNumberType = type === 'number';
    const hasNumber =
      isNumberType && (Array.isArray(value) ? value.every((it) => typeof it === 'number') : isNumber(value));

    if (isPureCollection) {
      const isFileType = type === 'file' && isString(value);

      if (isNumberType) {
        setComponentMode(!hasNumber ? 'component' : 'input');
      } else if (isBooleanType) {
        setComponentMode(!hasBoolean ? 'component' : 'input');
      } else if (isFileType) {
        setComponentMode(/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(value) ? 'component' : 'input');
      } else {
        const hasElement =
          Array.isArray(value) &&
          value
            .filter((it) => typeof it === type)
            .map((it) => it.toString())
            .every((it) => !isEmpty(it));
        setComponentMode(hasElement ? 'component' : 'input');
      }
    }

    return isBooleanType ? hasBoolean : isNumberType ? hasNumber : !isEmpty(value);
  }, [value, type, isPureCollection]);

  const useSimpleInput = !enableEditor && !isMultiFieldObject && !assetType;
  const hasCollectionInput = useSimpleInput && isPureCollection && componentMode === 'component';
  const hasStringInput =
    useSimpleInput && (componentMode === 'input' ? isPureCollection : type === 'string' && !hasCollectionInput);
  const hasBooleanInput = useSimpleInput && type === 'boolean' && (componentMode === 'input' || !isPureCollection);
  const hasNumberInput = useSimpleInput && type === 'number' && (componentMode === 'input' || !isPureCollection);
  const hasOptionsInput = useSimpleInput && type === 'options' && (componentMode === 'input' || !isPureCollection);
  const hasFileInput = useSimpleInput && componentMode === 'component' && type === 'file';
  const hasPresetOptions = assetType;
  const hasNotice = type === 'notice';
  const hasQrcode = type === ('qrcode' as any);
  const isBlankInput =
    useSimpleInput &&
    !hasNotice &&
    !hasCollectionInput &&
    !hasStringInput &&
    !hasBooleanInput &&
    !hasNumberInput &&
    !hasOptionsInput &&
    !hasFileInput &&
    !hasQrcode &&
    !hasPresetOptions;

  const [tempValue, setTempValue] = useState(value);

  const handleUpdateChange = useCallback(
    !disabled
      ? debounce((value: unknown) => onChange?.(value), hasCollectionInput || hasBooleanInput ? 0 : 164)
      : () => {},
    [hasCollectionInput, hasBooleanInput, disabled],
  );

  const handleOnChange = (value: unknown) => {
    setTempValue(value);
    handleUpdateChange(value);
  };

  const handleOnRadioChange = useCallback(
    (it: string) => {
      void (!assetType && onChange?.(null));
      setTimeout(() => setComponentMode(it as 'component' | 'input'));
    },
    [assetType],
  );

  const finalProps = { ...childProps, onChange: handleOnChange, value: tempValue };

  return (
    <InputPropertyWrapper
      def={def}
      nodeId={nodeId}
      headerVisible={type !== 'notice'}
      isMultiple={isMultipleValues}
      hasValue={hasValue}
      headerExtra={
        type === 'file' ? (
          <Tabs value={componentMode} onValueChange={handleOnRadioChange}>
            <TabsList className="!h-6">
              <TabsTrigger value="component" className="text-xxs !py-1">
                文件上传
              </TabsTrigger>
              <TabsTrigger value="input" className="text-xxs !py-1">
                变量输入
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          (isPureCollection || assetType) &&
          assetType !== 'fork-join-branch' && (
            <Tabs value={componentMode} onValueChange={handleOnRadioChange}>
              <TabsList className="!h-6">
                <TabsTrigger value="component" className="text-xxs !py-1">
                  {assetType ? '变量输入' : '列表'}
                </TabsTrigger>
                <TabsTrigger value="input" className="text-xxs !py-1">
                  {assetType ? '预置选项' : '变量输入'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )
        )
      }
    >
      {enableEditor && <EditorInput disabled={disabled} {...finalProps} />}
      {isMultiFieldObject && <MultiFieldObjectInput {...finalProps} />}

      {hasStringInput && <StringInput {...finalProps} />}
      {hasQrcode && <QRCodeInput {...finalProps} />}
      {hasBooleanInput && <BooleanInput {...finalProps} />}
      {hasNumberInput && <NumberInput {...finalProps} />}
      {hasOptionsInput && <OptionsInput {...finalProps} />}
      {hasFileInput && <FileInput {...finalProps} />}

      {hasCollectionInput && type !== 'file' && <CollectionInput {...finalProps} />}
      {hasPresetOptions && (
        <PresetInput
          typeOptions={typeOptions}
          componentMode={componentMode}
          setComponentMode={setComponentMode}
          {...finalProps}
        />
      )}

      {isBlankInput && <BlankInput {...finalProps} />}
      {hasNotice && <NoticeInput {...finalProps} />}
    </InputPropertyWrapper>
  );
};