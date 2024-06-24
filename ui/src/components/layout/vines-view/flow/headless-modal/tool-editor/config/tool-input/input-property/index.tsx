import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlockDefPropertyTypeOptions, BlockDefPropertyTypes } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { useForceUpdate } from '@mantine/hooks';
import { debounce, get, isEmpty, isNumber, isString } from 'lodash';
import { useTranslation } from 'react-i18next';
import { PresetInput } from 'src/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset';

import { BlankInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/blank.tsx';
import { BooleanInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/boolean.tsx';
import { CollectionInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/collection.tsx';
import { EditorInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/editor';
import { InsertVariable } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/editor/insert-variable.tsx';
import { FileInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/file.tsx';
import { MultiFieldObjectInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/multi-field-object.tsx';
import { NoticeInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/notice.tsx';
import { NumberInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/number.tsx';
import { OptionsInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/options.tsx';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { InputPropertyWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/wrapper';
import { IVinesEditorRefProps } from '@/components/ui/code-editor';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { IVinesVariableMap, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export interface IVinesInputPropertyProps {
  def: VinesToolDefProperties;
  value: unknown;
  onChange: (value: unknown) => void;
  nodeId: string;
  variableMapper: Record<string, IVinesVariableMap>;
  disabled?: boolean;
  refresh?: boolean;
}

const isVariableValue = (value: unknown) => isString(value) && /\$\{[\w.:_]+}|\$\.[\w.]+/g.test(value);

export const VinesInputProperty: React.FC<IVinesInputPropertyProps> = memo((props) => {
  const { t } = useTranslation();

  const { def, nodeId, disabled } = props;
  const { onChange, value, ...childProps } = props;
  const [type, typeOptions, isMultipleValues, enableEditor, isPureCollection, isMultiFieldObject, assetType] =
    useMemo(() => {
      const options = get(def, 'typeOptions', {}) as BlockDefPropertyTypeOptions;
      const type = get(def, 'type', 'string') as BlockDefPropertyTypes;
      const isMultipleValues = get(options, 'multipleValues', false);
      const isMultiFieldObject = get(options, 'multiFieldObject', false);
      const enableEditor = get(options, 'editor', null) === 'code' || (type === 'json' && !isMultiFieldObject);

      const isPureCollection = ['string', 'boolean', 'number', 'file'].includes(type) && isMultipleValues;
      const assetType = get(options, 'assetType', null);

      return [type, options, isMultipleValues, enableEditor, isPureCollection, isMultiFieldObject, assetType];
    }, [def]);

  const forceUpdate = useForceUpdate();
  const [componentMode, setComponentMode] = useState<'component' | 'input'>('component');
  const [isManualComponentMode, setIsManualComponentMode] = useState(false);

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

    return isBooleanType ? hasBoolean : isNumberType ? hasNumber : !isEmpty(value);
  }, [value, type, isPureCollection]);

  const useInputComponent = componentMode === 'input';

  const useSimpleInput = (useInputComponent ? true : !enableEditor) && !isMultiFieldObject && !assetType;
  const hasCollectionInput = useSimpleInput && isPureCollection && !useInputComponent;
  const hasStringInput =
    useSimpleInput &&
    (useInputComponent
      ? isPureCollection || isManualComponentMode || ['file', 'string'].includes(type)
      : type === 'string' && !hasCollectionInput);

  const hasBooleanInput = useSimpleInput && type === 'boolean' && (useInputComponent || !isPureCollection);
  const hasNumberInput = useSimpleInput && type === 'number' && (useInputComponent || !isPureCollection);
  const hasOptionsInput = useSimpleInput && type === 'options' && (useInputComponent || !isPureCollection);
  const hasFileInput = useSimpleInput && !useInputComponent && type === 'file';
  const hasPresetOptions = assetType;
  const hasNotice = type === 'notice';
  const isBlankInput =
    useSimpleInput &&
    !hasNotice &&
    !hasCollectionInput &&
    !hasStringInput &&
    !hasBooleanInput &&
    !hasNumberInput &&
    !hasOptionsInput &&
    !hasFileInput &&
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

  const handleOnRadioChange = (it: string) => {
    if (!assetType) {
      onChange?.(void 0);
      setTempValue(void 0);
    }

    setTimeout(() => setComponentMode(it as 'component' | 'input'));
  };

  const finalProps = { ...childProps, onChange: handleOnChange, value: tempValue };

  useEffect(() => {
    if ((!isPureCollection || !assetType) && isString(tempValue)) {
      if (isVariableValue(tempValue)) {
        if (enableEditor) {
          if (tempValue.startsWith('$')) {
            setIsManualComponentMode(true);
            setComponentMode('input');
          }
        } else {
          setComponentMode('input');
        }
      }
    }
  }, []);

  const editorRef = useRef<IVinesEditorRefProps>({ insertText: () => {} });

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
                {t('workspace.flow-view.headless-modal.tool-editor.input.file-upload')}
              </TabsTrigger>
              <TabsTrigger value="input" className="text-xxs !py-1">
                {t('workspace.flow-view.headless-modal.tool-editor.input.variable-input')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (isPureCollection || assetType) && assetType !== 'fork-join-branch' ? (
          <Tabs value={componentMode} onValueChange={handleOnRadioChange}>
            <TabsList className="!h-6">
              <TabsTrigger value="component" className="text-xxs !py-1">
                {assetType
                  ? t('workspace.flow-view.headless-modal.tool-editor.input.variable-input')
                  : t('workspace.flow-view.headless-modal.tool-editor.input.collection-input')}
              </TabsTrigger>
              <TabsTrigger value="input" className="text-xxs !py-1">
                {assetType
                  ? t('workspace.flow-view.headless-modal.tool-editor.input.preset-options')
                  : t('workspace.flow-view.headless-modal.tool-editor.input.variable-input')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : ['boolean', 'options'].includes(type) ? (
          <div className="flex items-center space-x-2">
            <Switch
              size="small"
              checked={useInputComponent}
              onCheckedChange={(enable) => {
                handleOnRadioChange(enable ? 'input' : 'component');
                setIsManualComponentMode(enable);
              }}
            />
            <Label className="text-xs font-medium text-muted-foreground">
              {t('workspace.flow-view.headless-modal.tool-editor.input.variable-input')}
            </Label>
          </div>
        ) : enableEditor ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center space-x-2">
              <Switch
                size="small"
                checked={useInputComponent}
                onCheckedChange={(enable) => {
                  handleOnRadioChange(enable ? 'input' : 'component');
                  setIsManualComponentMode(enable);
                }}
              />
              <Label className="text-xs font-medium text-muted-foreground">
                {t('workspace.flow-view.headless-modal.tool-editor.input.variable-input')}
              </Label>
            </div>
            {!isManualComponentMode && (
              <>
                <Separator orientation="vertical" className="ml-2 h-4" />
                <InsertVariable insertVariablesFn={editorRef.current.insertText} />
              </>
            )}
          </div>
        ) : null
      }
    >
      {enableEditor && !useInputComponent && (
        <EditorInput editorRef={editorRef} disabled={disabled} onInitial={forceUpdate} {...finalProps} />
      )}
      {isMultiFieldObject && <MultiFieldObjectInput {...finalProps} />}

      {hasStringInput && <StringInput {...finalProps} />}

      {!isManualComponentMode && (
        <>
          {hasBooleanInput && <BooleanInput {...finalProps} />}
          {hasNumberInput && <NumberInput {...finalProps} />}
          {hasOptionsInput && <OptionsInput {...finalProps} />}
          {hasFileInput && <FileInput {...finalProps} />}
        </>
      )}

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
});

VinesInputProperty.displayName = 'VinesInputProperty';
