import React, { Dispatch, SetStateAction, useContext, useEffect } from 'react';

import './index.scss';

import {
  ContextMenu,
  DEFAULT_SUPPORT_VIDEO_TYPES,
  DEFAULT_SUPPORTED_IMAGE_TYPES,
  defaultBindingUtils,
  DefaultContextMenuContent,
  defaultEditorAssetUrls,
  defaultShapeTools,
  defaultShapeUtils,
  defaultTools,
  Editor,
  registerDefaultExternalContentHandlers,
  registerDefaultSideEffects,
  Tldraw,
  useToasts,
  useTranslation
} from 'tldraw';

import { EditorContext } from '@/store/useBoardStore';

import 'tldraw/tldraw.css';

export const Board: React.FC<{
  editor: Editor | null;
  setEditor: Dispatch<SetStateAction<Editor | null>>;
}> = ({ editor, setEditor }) => {
  return (
    <div className="h-full w-full">
      <Tldraw
        onMount={(editor: Editor) => setEditor(editor)}
        shapeUtils={defaultShapeUtils}
        bindingUtils={defaultBindingUtils}
        tools={[...defaultTools, ...defaultShapeTools]}
        assetUrls={defaultEditorAssetUrls}
      >
        <InsideEditorAndUiContext />
      </Tldraw>
    </div>
  );
};

const InsideEditorAndUiContext: React.FC = () => {
  const { editor } = useContext(EditorContext);
  const toasts = useToasts();
  const msg = useTranslation();

  useEffect(() => {
    if (!editor) return;

    registerDefaultExternalContentHandlers(editor, {
      maxImageDimension: 5000,
      maxAssetSize: 10 * 1024 * 1024, // 10mb
      acceptedImageMimeTypes: DEFAULT_SUPPORTED_IMAGE_TYPES,
      acceptedVideoMimeTypes: DEFAULT_SUPPORT_VIDEO_TYPES,
      toasts,
      msg,
    });

    const cleanupSideEffects = registerDefaultSideEffects(editor);

    return () => {
      cleanupSideEffects();
    };
  }, [editor, msg, toasts]);

  return (
    <ContextMenu>
      <DefaultContextMenuContent />
    </ContextMenu>
  );
};
