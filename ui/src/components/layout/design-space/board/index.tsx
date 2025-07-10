import React, { startTransition, useCallback, useEffect } from 'react';

import './index.scss';

import {
  AssetRecordType,
  createShapeId,
  defaultBindingUtils,
  defaultEditorAssetUrls,
  defaultShapeTools,
  defaultTools,
  Editor,
  FrameShapeUtil,
  TLComponents,
  Tldraw,
  TLShape,
  TLShapeId,
} from 'tldraw';

import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';
import { getImageSize } from '@/utils/file';

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
  persistenceKey?: string;
}

export const Board: React.FC<BoardProps> = ({
  editor,
  setEditor,
  canvasWidth,
  canvasHeight,
  instance,
  persistenceKey,
}) => {
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

  // 定义自定义组件配置
  const components: TLComponents = {
    PageMenu: () => null,
    MainMenu: () => null,
    StylePanel: () => null,
    Toolbar: () => null,
  };

  return (
    <div className="h-full w-full">
      <Tldraw
        persistenceKey={persistenceKey}
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
          editor.registerExternalContentHandler('url', async ({ url }) => {
            // 检查是否是图片 URL
            try {
              // 获取图片数据

              // 创建 asset
              const imageUrl = url;
              const { width, height } = await getImageSize(imageUrl);
              const assetData = {
                id: AssetRecordType.createId(),
                url: imageUrl,
                width: width,
                height: height,
              };

              editor.createAssets([
                {
                  id: assetData.id,
                  type: 'image',
                  typeName: 'asset',
                  props: {
                    name: assetData.id,
                    src: assetData.url,
                    mimeType: 'image/png',
                    isAnimated: false,
                    h: assetData.height,
                    w: assetData.width,
                  },
                  meta: {},
                },
              ]);

              editor.createShape({
                type: 'image',
                props: {
                  assetId: assetData.id,
                  w: assetData.width,
                  h: assetData.height,
                },
              });

              return true; // 表示已处理
            } catch (e) {
              console.error(e);
            }

            return false; // 未处理,使用默认行为
          });
        }}
        components={components}
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
      ></Tldraw>
    </div>
  );
};
