import React, { Dispatch, SetStateAction, startTransition, useCallback, useContext, useEffect } from 'react';

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
  DefaultToolbar,
  defaultTools,
  Editor,
  FrameShapeUtil,
  registerDefaultExternalContentHandlers,
  registerDefaultSideEffects,
  Tldraw,
  TLShape,
  TLShapeId,
  useToasts,
  useTranslation,
} from 'tldraw';

import { EditorContext } from '@/store/useBoardStore';
import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';

import 'tldraw/tldraw.css';

class FixedFrameShapeUtil extends FrameShapeUtil {
  // override canResize() {
  //   return true;
  // }
}

type BoardInstance = {
  frameShapeId: TLShapeId;
};

interface BoardProps {
  editor: Editor | null;
  setEditor: (editor: Editor) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  instance?: BoardInstance;
}

export const Board: React.FC<BoardProps> = ({ editor, setEditor, canvasWidth, canvasHeight, instance }) => {
  const frameShapeId = instance?.frameShapeId || createShapeId();

  const { setBoardCanvasSize, width, height } = useBoardCanvasSizeStore();

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
        name: 'Design Board',
      },
    });

    // 设置视图以适应画板
    editor.zoomToFit();
  }, []);

  useEffect(() => {
    if (width && height && editor) {
      editor.updateShape({
        id: frameShapeId,
        type: 'frame',
        props: {
          w: width,
          h: height,
        },
      });
    }
  }, [width, height]);

  return (
    <div className="h-full w-full">
      <Tldraw
        onMount={(editor: Editor) => {
          setEditor(editor);
          editor.sideEffects.registerBeforeDeleteHandler('shape', (shape: TLShape) => {
            if (shape.id === frameShapeId) {
              return false;
            }
          });

          editor.sideEffects.registerBeforeChangeHandler('shape', (prevShape: TLShape, nextShape: TLShape) => {
            if (prevShape.id === frameShapeId) {
              if (nextShape.type === 'frame' && 'w' in nextShape.props && 'h' in nextShape.props) {
                startTransition(() => {
                  // @ts-ignore
                  setBoardCanvasSize(nextShape.props.w as number, nextShape.props.h as number);
                });
              }
              return nextShape;
            }
            return nextShape;
          });

          // 如果提供了画布尺寸，则创建有界 frame
          if (canvasWidth && canvasHeight) {
            createFrame(editor, canvasWidth, canvasHeight);
          }
        }}
        components={{
          Toolbar: () => {
            return <DefaultToolbar></DefaultToolbar>;
          },
        }}
        shapeUtils={[FixedFrameShapeUtil]}
        bindingUtils={defaultBindingUtils}
        tools={[...defaultShapeTools, ...defaultTools]}
        assetUrls={defaultEditorAssetUrls}
        overrides={{
          tools: (_editor, tools) => {
            // Remove the text tool
            delete tools.frame;
            return tools;
          },
        }}
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
