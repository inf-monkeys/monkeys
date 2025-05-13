import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo } from 'react';

import './index.scss';

import {
  ContextMenu,
  createShapeId,
  DEFAULT_SUPPORT_VIDEO_TYPES,
  DEFAULT_SUPPORTED_IMAGE_TYPES,
  defaultBindingUtils,
  DefaultContextMenuContent,
  defaultEditorAssetUrls,
  defaultShapeTools,
  defaultTools,
  Editor,
  FrameShapeUtil,
  registerDefaultExternalContentHandlers,
  registerDefaultSideEffects,
  Tldraw,
  TLShapeId,
  useToasts,
  useTranslation
} from 'tldraw';

import { EditorContext } from '@/store/useBoardStore';

import 'tldraw/tldraw.css';

class FixedFrameShapeUtil extends FrameShapeUtil {
  override canResize() {
    return false
  }
}


type BoardInstance = {
  frameShapeId: TLShapeId;
}

interface BoardProps {
  editor: Editor | null;
  setEditor: Dispatch<SetStateAction<Editor | null>>;
  canvasWidth?: number;
  canvasHeight?: number;
  instance?: BoardInstance;
}

export const Board: React.FC<BoardProps> = ({
  editor,
  setEditor,
  canvasWidth,
  canvasHeight,
  instance
}) => {

  const frameShapeId = instance?.frameShapeId || createShapeId();

  // 创建自定义组件
  const components = useMemo(() => {
    if (!canvasWidth || !canvasHeight) return {};

    return {
    };
  }, [canvasWidth, canvasHeight]);

  const createFrame = useCallback((editor: Editor, width: number, height: number) => {
    editor.createShape({
      type: 'frame',
      id: frameShapeId,
      x: 0,
      y: 0,
      props: {
        w: width,
        h: height,
        color: 'white',
        name: 'Design Board'
      },
    });

    // // 锁定背景形状
    // editor.updateShape({
    //   id: shapeId,
    //   type: 'frame',
    //   isLocked: true,
    // });

    // // 将背景形状发送到最底层
    // editor.sendToBack([shapeId]);

    // 设置视图以适应画板
    editor.zoomToFit();

  }, []);

  useEffect(() => {
    if (canvasWidth && canvasHeight && editor) {
      editor.updateShape({
        id: frameShapeId,
        type: 'frame',
        props: {
          w: canvasWidth,
          h: canvasHeight,
        },
      });

      editor.zoomToFit();
    }
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="h-full w-full">
      <Tldraw
        onMount={(editor: Editor) => {
          setEditor(editor);

          // 如果提供了画布尺寸，则创建有界 frame
          if (canvasWidth && canvasHeight) {
            createFrame(editor, canvasWidth, canvasHeight);
          }
        }}
        shapeUtils={[FixedFrameShapeUtil]}
        bindingUtils={defaultBindingUtils}
        tools={[...defaultTools, ...defaultShapeTools]}
        assetUrls={defaultEditorAssetUrls}
        components={components}
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
