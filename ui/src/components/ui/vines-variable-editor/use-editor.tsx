import React, { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import _ from 'lodash';
import { createEditor, Editor, Element, Text, Transforms } from 'slate';
import { HistoryEditor, withHistory } from 'slate-history';
import { Editable, ReactEditor, RenderElementProps, Slate, useFocused, useSelected, withReact } from 'slate-react';
import { EditableProps, RenderLeafProps } from 'slate-react/dist/components/editable';

import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

type CustomElement = Element & { type?: string; _type?: string; name?: string; pointer?: string };
type CustomDescendant = CustomElement;
type CustomLeaf = Text & { pointer?: string; name?: string; type?: string; _type?: string; children?: CustomLeaf[] };
type VariableEditorProps = Omit<EditableProps, 'renderElement'>;
type PointerMapper = { [propertyPoint: string]: VinesToolDefProperties };
export type UseVariableEditorOptions = {
  width?: number;
  initialValue: string;
  className?: string;
  initialPointMapper?: PointerMapper;
  onChange?: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

export const VariableSchemaTypeMark: React.FC<{ schema?: string; rounded?: boolean }> = ({
  schema,
  rounded = false,
}) => {
  const displayText = useMemo(
    () => (schema ? (/^[a-zA-Z0-9]+$/.test(schema) ? schema.slice(0, 3).toUpperCase() : schema) : 'VAR'),
    [],
  );
  return (
    <span
      className="mr-1 inline-block"
      style={{ background: VINES_VARIABLE_TAG[schema ?? '']?.color ?? '#333', borderRadius: rounded ? 2 : 0 }}
    >
      <span className="inline-block scale-75 font-bold text-white">{displayText}</span>
    </span>
  );
};

const withVariable = (editor: ReactEditor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element: CustomElement) => {
    return element.type === 'variable' ? true : isInline(element);
  };

  editor.isVoid = (element: CustomElement) => {
    return element.type === 'variable' ? true : isVoid(element);
  };

  return editor;
};

/**
 * @returns
 * @param opt
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useVariableEditor = (opt: UseVariableEditorOptions) => {
  const { initialValue, initialPointMapper = {}, onChange, width, onBlur, onFocus } = opt;
  const [editor] = useState(() => withVariable(withHistory(withReact(createEditor()))));
  const [pointerMapper, setPointerMapper] = useState(initialPointMapper);
  const editorStateRef = useRef({ updateLock: true });

  useEffect(() => {
    setPointerMapper(initialPointMapper);
  }, [initialPointMapper]);

  const convertTextToDescendants = useCallback(
    (text: string): CustomDescendant[] => {
      const pointerSortedMapper = _.sortBy(Object.entries(pointerMapper), ([key]) => -key.length).reverse();
      const pointerKeyMapper = ['\n', ...pointerSortedMapper.map(([it]) => it)];

      try {
        const exactMatchRegex = new RegExp(`^${text.replace(/\s/g, '')}$`);
        pointerKeyMapper.sort((a, b) => (exactMatchRegex.test(b) ? 1 : exactMatchRegex.test(a) ? -1 : 0));
      } catch (e) {
        console.warn('[VinesEditor] 无法解析的文本', e);
        // toast.error(t('components.ui.vines-variable-editor.cannot-parse-toast'));
      }

      const finalTextArr: string[] = [];
      let i = 0;

      while (i < text.length) {
        const prefix = _.find(pointerKeyMapper, (it) => _.startsWith(text, it, i));

        if (prefix) {
          finalTextArr.push(prefix);
          i += prefix.length;
        } else {
          finalTextArr.push(text.charAt(i));
          i++;
        }
      }

      const finalTextArrGroup: string[][] = [[]];
      let finalTextArrGroupIndex = 0;

      finalTextArr.forEach((it) => {
        if (it === '\n') {
          finalTextArrGroupIndex++;
          finalTextArrGroup[finalTextArrGroupIndex] = [];
        } else {
          finalTextArrGroup[finalTextArrGroupIndex].push(it);
        }
      });

      const paragraphs: CustomDescendant[] = [];

      finalTextArrGroup.forEach((it) => {
        const children: CustomLeaf[] = [];

        for (const character of it) {
          if (pointerKeyMapper.includes(character)) {
            const pointer = character;
            const { displayName: schemaDisplayName, type: schemaType } = pointerMapper[pointer];

            children.push({
              type: 'variable',
              pointer,
              name: schemaDisplayName,
              _type: schemaType,
              children: [{ text: '' }],
            } as unknown as CustomLeaf);
          } else {
            children.push({ text: character });
          }
        }

        paragraphs.push({ type: 'paragraph', children });
      });

      const mergedParagraphs: CustomDescendant[] = [];

      paragraphs.forEach((paragraph) => {
        let children = paragraph.children as CustomLeaf[];

        children = children.reduce((acc: CustomLeaf[], cur: CustomLeaf) => {
          if (acc.length === 0) {
            return [cur];
          }

          const last = acc[acc.length - 1];

          if (last.text && cur.text) {
            last.text += cur.text;
          } else {
            acc.push(cur);
          }

          return acc;
        }, []);

        mergedParagraphs.push({ ...paragraph, children });
      });

      return mergedParagraphs.map((paragraph) => {
        if (paragraph.children.length === 0) {
          return { ...paragraph, children: [{ text: '' }] };
        }

        return paragraph;
      });
    },
    [pointerMapper],
  );

  useEffect(() => {
    editorStateRef.current.updateLock = true;
    Transforms.delete(editor);
    const nodes = convertTextToDescendants(initialValue);
    HistoryEditor.withoutSaving(editor as unknown as HistoryEditor, () => editor.insertNodes(nodes));
    setTimeout(() => (editorStateRef.current.updateLock = false), 100);
  }, []);

  const VariableElement = (props: Partial<RenderElementProps>) => {
    const { attributes } = props;
    const element = props.element as CustomElement;

    const selected = useSelected();
    const focused = useFocused();

    return (
      <span
        className={cn(
          'm-0.5 line-clamp-1 inline-block w-fit translate-y-0.5 cursor-pointer rounded-sm border border-solid border-input bg-gray-3 pr-1 align-sub shadow-sm transition-all dark:bg-[#111113]',
          selected && focused && '!border-vines-500 font-bold !opacity-100',
        )}
        {...attributes}
        contentEditable={false}
      >
        <VariableSchemaTypeMark schema={element._type} />
        <span className="align-middle text-xs dark:text-[#E4E3E4]">
          {element.name}
          {props?.children}
        </span>
      </span>
    );
  };

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, element } = props;
    switch ((element as CustomElement).type) {
      case 'variable':
        return <VariableElement {...props} />;
      default:
        return (
          <p className="align-middle leading-tight dark:text-[#E4E3E4]" {...attributes}>
            {props?.children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => (
      <span className="inline-block pt-0.5 align-middle dark:text-[#E4E3E4] [&_span]:mt-1" {...props.attributes}>
        {props?.children}
      </span>
    ),
    [],
  );

  const insertVariable = useCallback(
    (pointer: string) => {
      const { selection } = editor;
      if (selection) {
        const variableDisplayName = pointerMapper[pointer]?.displayName ?? pointer;
        Editor.insertNode(
          editor,
          {
            type: 'variable',
            pointer,
            name: variableDisplayName,
            _type: pointerMapper[pointer]?.type,
            children: [{ text: '' }],
          } as CustomElement,
          {
            at: Editor.before(editor, selection),
          },
        );
      }
    },
    [pointerMapper],
  );

  const handleSlateEditorValueChange = useCallback((val: CustomDescendant[]) => {
    if (!val) return;

    let str = '';
    val.forEach((element) => {
      if (element.type === 'variable') {
        str += element.pointer;
      } else {
        element?.children?.forEach((c) => {
          const { text, pointer } = c as CustomLeaf;
          str += pointer || text || '';
        });
      }
      str += '\n';
    });

    onChange?.(str.trim());
  }, []);

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      const { selection } = editor;
      if (!selection) return;
      const [node, path] = editor.node(selection);
      const isVariable = Editor.string(editor, selection) === '' && (node as CustomLeaf)?.pointer; // pointer 元素
      if (event.key === 'Backspace' && isVariable) {
        Transforms.removeNodes(editor, { at: path });
        event.preventDefault();
      }

      if (event.key === 'ArrowRight') {
        const isEnd = Editor.isEnd(editor, selection.anchor, path);
        if (isEnd && isVariable) {
          Transforms.insertNodes(editor, { text: ' ' }, { at: selection.anchor });
        }
      }
    },
    [editor, Editor, Transforms],
  );

  const VariableEditor: React.FC<VariableEditorProps> = (props) => {
    return (
      <div
        className={cn(
          'relative min-h-10 rounded-md border border-input text-sm has-[:focus-visible]:!ring-2 has-[:focus-visible]:!ring-vines-500 has-[:focus-visible]:!ring-offset-2 dark:bg-[#111113] [&>div]:mt-1',
          opt.className,
        )}
      >
        <Slate
          editor={editor}
          initialValue={[]}
          onChange={(val) => {
            if (!editorStateRef.current.updateLock) {
              handleSlateEditorValueChange(val as CustomDescendant[]);
            }
          }}
        >
          <Editable
            {...props}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            onFocus={onFocus}
            className="flex-initial overflow-hidden whitespace-pre-wrap break-words px-2 py-1 outline-none transition-all dark:bg-[#111113] dark:text-[#E4E3E4]"
            style={{ width }}
          />
        </Slate>
      </div>
    );
  };

  return { VariableEditor, insertVariable, setVariableNameMapper: setPointerMapper, onChange };
};
