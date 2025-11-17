import { createContext, useContext, useEffect, useState } from 'react';

import * as fal from '@fal-ai/serverless-client';
import { Editor, FileHelpers, getHashForObject, TLShape, TLShapeId, useEditor } from 'tldraw';
import { v4 as uuid } from 'uuid';

import { LiveImageShape } from '../shapes/live-image/LiveImageShapeUtil';
import { getShapePortConnections } from '../shapes/ports/portConnections';
import { fastGetSvgAsImage } from '../utils/screenshot';

// Configure fal client to use backend proxy
fal.config({
  requestMiddleware: fal.withProxy({
    targetUrl: '/api/fal/proxy',
  }),
});

type LiveImageResult = { url: string };
type LiveImageRequest = {
  prompt: string;
  image_url: string;
  sync_mode: boolean;
  strength: number;
  seed: number;
  enable_safety_checks: boolean;
};
type LiveImageContextType = null | ((req: LiveImageRequest) => Promise<LiveImageResult>);
const LiveImageContext = createContext<LiveImageContextType>(null);

export function LiveImageProvider({
  children,
  appId,
  throttleTime = 0,
  timeoutTime = 5000,
}: {
  children: React.ReactNode;
  appId: string;
  throttleTime?: number;
  timeoutTime?: number;
}) {
  const [count, setCount] = useState(0);
  const [fetchImage, setFetchImage] = useState<{ current: LiveImageContextType }>({ current: null });

  useEffect(() => {
    const requestsById = new Map<
      string,
      {
        resolve: (result: LiveImageResult) => void;
        reject: (err: unknown) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    >();

    const { send, close } = fal.realtime.connect(appId, {
      connectionKey: 'fal-realtime-example',
      clientOnly: false,
      throttleInterval: throttleTime,
      onError: (error) => {
        console.error(error);
        setTimeout(() => {
          setCount((count) => count + 1);
        }, 500);
      },
      onResult: (result: any) => {
        if (result.images && result.images[0]) {
          const id = result.request_id;
          const request = requestsById.get(id);
          if (request) {
            request.resolve(result.images[0]);
          }
        }
      },
    });

    setFetchImage({
      current: (req) => {
        return new Promise((resolve, reject) => {
          const id = uuid();
          const timer = setTimeout(() => {
            requestsById.delete(id);
            reject(new Error('Timeout'));
          }, timeoutTime);
          requestsById.set(id, {
            resolve: (res) => {
              resolve(res);
              clearTimeout(timer);
            },
            reject: (err) => {
              reject(err);
              clearTimeout(timer);
            },
            timer,
          });
          send({ ...req, request_id: id });
        });
      },
    });

    return () => {
      for (const request of requestsById.values()) {
        request.reject(new Error('Connection closed'));
      }
      try {
        close();
      } catch {
        // noop
      }
    };
  }, [appId, count, throttleTime, timeoutTime]);

  return <LiveImageContext.Provider value={fetchImage.current}>{children}</LiveImageContext.Provider>;
}

export function useLiveImage(shapeId: TLShapeId, { throttleTime = 64 }: { throttleTime?: number } = {}) {
  const editor = useEditor();
  const fetchImage = useContext(LiveImageContext);

  useEffect(() => {
    if (!fetchImage) {
      return;
    }

    const fetchImageFn = fetchImage;

    let prevHash = '';
    let prevPromptSignature = '';

    let startedIteration = 0;
    let finishedIteration = 0;

    async function updateDrawing() {
      const frame = editor.getShape<LiveImageShape>(shapeId);
      if (!frame) {
        return;
      }
      const shapes = getShapesTouching(shapeId, editor);
      const hash = getHashForObject([...shapes]);
      const frameName = frame.props.name || '';

      // 读取所有输出连线的 label，用于构成配置签名（同一草图+同一提示词集合则跳过）
      const connections = getShapePortConnections(editor, frame.id);
      const outputConns = connections.filter(
        (c) => c.terminal === 'start' && c.ownPortId === 'output',
      );
      const labelsSignature = outputConns
        .map((conn) => {
          const connectionShape = editor.getShape(conn.connectionId as any) as any;
          return ((connectionShape?.props?.label as string) || '').trim();
        })
        .sort()
        .join('|');

      const configSignature = `${frameName}|${labelsSignature}`;

      if (hash === prevHash && configSignature === prevPromptSignature) return;

      startedIteration += 1;
      const iteration = startedIteration;

      prevHash = hash;
      prevPromptSignature = configSignature;

      try {
        const bounds = editor.getShapePageBounds(shapeId);
        if (!bounds) {
          return;
        }

        const svgStringResult = await editor.getSvgString([...shapes], {
          background: true,
          padding: 0,
          darkMode: editor.user.getIsDarkMode(),
          bounds,
          scale: 512 / frame.props.w,
        });

        if (!svgStringResult) {
          console.warn('No SVG');
          updateImage(editor, frame.id, null);
          return;
        }

        const svgString = svgStringResult.svg;

        if (iteration <= finishedIteration) return;

        const blob = await fastGetSvgAsImage(svgString, {
          type: 'jpeg',
          quality: 0.5,
          width: svgStringResult.width,
          height: svgStringResult.height,
        });

        if (iteration <= finishedIteration) return;

        if (!blob) {
          console.warn('No Blob');
          updateImage(editor, frame.id, null);
          return;
        }

        const imageUrl = await FileHelpers.blobToDataUrl(blob);

        if (iteration <= finishedIteration) return;

        if (outputConns.length === 0) {
          updateImage(editor, frame.id, null);
          return;
        }

        // 针对每一条连线使用独立的提示词（连线 label > 草图框标题 > 默认）
        const tasks = outputConns.map(async (conn) => {
          const connectionShape = editor.getShape(conn.connectionId as any) as any;
          const label = (connectionShape?.props?.label as string) || '';
          const trimmedLabel = label.trim();

          let promptBase = trimmedLabel || frameName;
          let prompt: string;
          if (promptBase) {
            prompt = promptBase + ' hd award-winning impressive';
          } else {
            prompt =
              'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor';
          }

          const result = await fetchImageFn({
            prompt,
            image_url: imageUrl,
            sync_mode: true,
            strength: 0.65,
            seed: 42,
            enable_safety_checks: false,
          });

          return { conn, url: result.url as string };
        });

        const settled = await Promise.allSettled(tasks);

        if (iteration <= finishedIteration) return;

        finishedIteration = iteration;

        // 按连线分别更新各自的 Output
        settled.forEach((res) => {
          if (res.status !== 'fulfilled') return;
          const { conn, url } = res.value;
          const target = editor.getShape(conn.connectedShapeId as any) as any;
          if (!target || target.type !== 'output') return;
          editor.updateShape({
            id: target.id,
            type: 'output',
            props: {
              ...target.props,
              imageUrl: url || '',
              images: url ? [url] : [],
            },
          });
        });
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        const isTimeout = msg === 'Timeout';
        const isClosed = msg === 'Connection closed';
        if (!isTimeout && !isClosed) {
          console.error(e);
        }

        if (iteration === startedIteration) {
          requestUpdate();
        }
      }
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    function requestUpdate() {
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        updateDrawing();
      }, throttleTime);
    }

    editor.on('update-drawings' as any, requestUpdate);
    return () => {
      editor.off('update-drawings' as any, requestUpdate);
    };
  }, [editor, fetchImage, shapeId, throttleTime]);
}

function updateImage(editor: Editor, shapeId: TLShapeId, url: string | null) {
  const shape = editor.getShape<LiveImageShape>(shapeId);
  if (!shape) {
    return;
  }

  // 查找从实时转绘框输出端口连出去的 Output 节点
  const connections = getShapePortConnections(editor, shapeId);
  const outputs = connections.filter(
    (c) => c.terminal === 'start' && c.ownPortId === 'output',
  );

  if (outputs.length === 0) {
    return;
  }

  outputs.forEach((conn) => {
    const target = editor.getShape(conn.connectedShapeId as any) as any;
    if (!target || target.type !== 'output') return;

    editor.updateShape({
      id: target.id,
      type: 'output',
      props: {
        ...target.props,
        imageUrl: url || '',
        images: url ? [url] : [],
      },
    });
  });
}

function getShapesTouching(shapeId: TLShapeId, editor: Editor) {
  const shapesTouching: TLShape[] = [];

  // 只截取实时转绘框内的子图层内容，避免把外面的 Output / Workflow 等节点一起渲染进 SVG
  const childIds = editor.getSortedChildIdsForParent(shapeId);
  for (const id of childIds) {
    const shape = editor.getShape(id);
    if (!shape) continue;
    // 忽略位图图片，避免跨域图片污染 canvas
    if (shape.type === 'image') continue;
    shapesTouching.push(shape);
  }

  return shapesTouching;
}
