import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstract3DModelProps {
  children: JSONValue;
}

export type Vines3DModelRenderMode = 'list' | 'detail';
export const Vines3DModelRenderModeContext = createContext<Vines3DModelRenderMode>('list');

type ViewState = {
  cameraPos: [number, number, number];
  target: [number, number, number];
};

// ============== IndexedDB 持久化缓存 ==============
const DB_NAME = 'vines-3d-model-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const CACHE_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天过期

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });

  return dbPromise;
}

async function getFromIndexedDB(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < CACHE_EXPIRE_MS) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(url: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ url, data, timestamp: Date.now() });
  } catch {
    // 静默失败，不影响主流程
  }
}

// ============== 内存缓存 ==============

// 视角缓存（按 URL）
const viewStateCache = new Map<string, ViewState>();

// 模型缓存（按 URL）
const sceneCache = new Map<string, THREE.Group>();
const inflight = new Map<string, Promise<THREE.Group>>();

// 缩略图缓存（按 URL）：列表展示用，解决多 Canvas 闪烁
const thumbnailCache = new Map<string, string>();

// 并发控制：限制同时加载的模型数量，避免大量并发请求导致服务器 502
const MAX_CONCURRENT_LOADS = 2;
let activeLoads = 0;
const pendingQueue: Array<{
  url: string;
  resolve: (group: THREE.Group) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue() {
  while (activeLoads < MAX_CONCURRENT_LOADS && pendingQueue.length > 0) {
    const task = pendingQueue.shift();
    if (!task) break;

    // 再次检查缓存，可能在排队期间已被其他请求加载
    const cached = sceneCache.get(task.url);
    if (cached) {
      task.resolve(cached);
      continue;
    }

    activeLoads++;
    doLoadScene(task.url)
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        activeLoads--;
        processQueue();
      });
  }
}

function parseGLTFFromBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      '',
      (gltf) => {
        const scene = (gltf as any)?.scene || (gltf as any)?.scenes?.[0];
        if (!scene) {
          reject(new Error('模型为空'));
          return;
        }
        resolve(scene as THREE.Group);
      },
      (e) => reject(e instanceof Error ? e : new Error(String(e))),
    );
  });
}

async function doLoadScene(url: string): Promise<THREE.Group> {
  // 1. 先尝试从 IndexedDB 读取
  const cachedBuffer = await getFromIndexedDB(url);
  if (cachedBuffer) {
    const group = await parseGLTFFromBuffer(cachedBuffer);
    sceneCache.set(url, group);
    return group;
  }

  // 2. 从网络加载
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`加载失败: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  // 3. 解析模型
  const group = await parseGLTFFromBuffer(arrayBuffer);
  sceneCache.set(url, group);

  // 4. 异步保存到 IndexedDB（不阻塞）
  saveToIndexedDB(url, arrayBuffer);

  return group;
}

async function loadScene(url: string): Promise<THREE.Group> {
  const cached = sceneCache.get(url);
  if (cached) return cached;

  const inflightPromise = inflight.get(url);
  if (inflightPromise) return inflightPromise;

  const p = new Promise<THREE.Group>((resolve, reject) => {
    pendingQueue.push({ url, resolve, reject });
    processQueue();
  }).finally(() => inflight.delete(url));

  inflight.set(url, p);
  return p;
}

function useCachedScene(url: string, onError: (msg: string) => void) {
  const [scene, setScene] = useState<THREE.Group | null>(() => sceneCache.get(url) ?? null);
  const [loading, setLoading] = useState(() => !sceneCache.has(url));

  useEffect(() => {
    let cancelled = false;

    const cached = sceneCache.get(url);
    if (cached) {
      setScene(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadScene(url)
      .then((s) => {
        if (cancelled) return;
        setScene(s);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoading(false);
        onError(e?.message || '模型加载失败');
      });

    return () => {
      cancelled = true;
    };
  }, [url, onError]);

  return { scene, loading };
}

function GLBModel({ url, scene }: { url: string; scene: THREE.Group }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, invalidate } = useThree();

  const model = useMemo(() => skeletonClone(scene) as THREE.Group, [scene]);

  useEffect(() => {
    if (!groupRef.current) return;

    // 居中+缩放模型
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxDim * 1.8;
    const scale = 2 / maxDim;

    groupRef.current.position.set(-center.x, -center.y, -center.z);
    groupRef.current.scale.setScalar(scale);

    // 恢复/初始化相机
    const saved = viewStateCache.get(url);
    if (saved) {
      camera.position.set(saved.cameraPos[0], saved.cameraPos[1], saved.cameraPos[2]);
      camera.lookAt(saved.target[0], saved.target[1], saved.target[2]);
    } else {
      camera.position.set(center.x + distance, center.y + distance, center.z + distance);
      camera.lookAt(0, 0, 0);
      viewStateCache.set(url, {
        cameraPos: [camera.position.x, camera.position.y, camera.position.z],
        target: [0, 0, 0],
      });
    }

    invalidate();
  }, [camera, invalidate, url]);

  return (
    // eslint-disable-next-line react/no-unknown-property
    <primitive ref={groupRef} object={model} />
  );
}

function ControlsDemand({ url }: { url: string }) {
  const { invalidate, camera } = useThree();
  const controlsRef = useRef<any>(null);

  const persistView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const pos = camera.position;
    const t = controls.target;
    viewStateCache.set(url, {
      cameraPos: [pos.x, pos.y, pos.z],
      target: [t.x, t.y, t.z],
    });
  }, [url, camera]);

  useEffect(() => {
    const saved = viewStateCache.get(url);
    const controls = controlsRef.current;
    if (!saved || !controls) return;
    controls.target.set(saved.target[0], saved.target[1], saved.target[2]);
    controls.update();
    invalidate();
  }, [url, invalidate]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      onStart={() => {
        persistView();
        invalidate();
      }}
      onChange={() => {
        persistView();
        invalidate();
      }}
      onEnd={() => {
        persistView();
        invalidate();
      }}
    />
  );
}

function CaptureThumbnail({ enabled, onCaptured }: { enabled: boolean; onCaptured: (dataUrl: string) => void }) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let raf = 0;
    let lastW = 0;
    let lastH = 0;
    let stableCount = 0;
    let tries = 0;

    const tick = () => {
      if (cancelled) return;
      tries += 1;

      // 触发渲染
      invalidate();

      const canvas = gl.domElement;
      const w = canvas.width;
      const h = canvas.height;

      // 等待尺寸稳定（瀑布流布局/resize 期间截容易白图）
      if (w > 0 && h > 0) {
        if (w === lastW && h === lastH) stableCount += 1;
        else stableCount = 0;
        lastW = w;
        lastH = h;
      }

      const ctx = (gl as any).getContext?.();
      const lost = ctx?.isContextLost?.() ?? false;
      const hasRendered = (gl.info?.render?.calls ?? 0) > 0;

      // 条件满足：尺寸稳定两帧 + 有渲染调用 + context 正常
      if (!lost && stableCount >= 2 && hasRendered) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl) onCaptured(dataUrl);
          return;
        } catch {
          // 如果截屏失败，继续重试几帧
        }
      }

      // 最多重试 60 帧（约 1s），避免一直占用
      if (tries < 60) {
        raf = requestAnimationFrame(tick);
      }
    };

    // 给一个极短延时，让 glTF 贴图/材质先开始加载
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, gl, invalidate, onCaptured]);

  return null;
}

function ModelViewer3D({ url, mode }: { url: string; mode: Vines3DModelRenderMode }) {
  const isDetail = mode === 'detail';

  const [error, setError] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(() => (isDetail ? null : thumbnailCache.get(url) ?? null));

  const stopScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    setError(null);
    if (isDetail) {
      setThumb(null);
      return;
    }
    const cachedThumb = thumbnailCache.get(url) ?? null;
    setThumb(cachedThumb);
  }, [url, isDetail]);

  const handleError = useCallback((msg: string) => setError(msg), []);
  const { scene, loading } = useCachedScene(url, handleError);

  const handleCaptured = useCallback(
    (dataUrl: string) => {
      if (isDetail) return;
      if (!thumbnailCache.has(url)) thumbnailCache.set(url, dataUrl);
      setThumb(dataUrl);
    },
    [url, isDetail],
  );

  const shouldMountCanvas = isDetail || (!thumb && !!scene);

  return (
    <div
      style={{
        width: '100%',
        // 列表缩略图更紧凑一些，避免卡片显得过高
        // detail: allow parent to control height (asset-detail wants full-height canvas)
        // fallback to 320px for other places that don't set a height
        height: isDetail ? 'var(--vines-3d-detail-height, 320px)' : '200px',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative',
        overscrollBehavior: 'contain',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={stopScroll}
      onWheelCapture={stopScroll}
    >
      {/* 列表模式：只显示缩略图（不提供预览/交互）；详情模式不显示缩略图 */}
      {thumb && !isDetail && (
        <img
          src={thumb}
          alt="3d-thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#F8FAFC' }}
        />
      )}

      {/* 详情模式：始终 Canvas；列表模式：仅在没有缩略图时，临时挂载 Canvas 生成缩略图（不提供交互） */}
      {shouldMountCanvas && scene && (
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={isDetail ? undefined : { preserveDrawingBuffer: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* eslint-disable-next-line react/no-unknown-property */}
          <color attach="background" args={['#F8FAFC']} />
          {/* eslint-disable-next-line react/no-unknown-property */}
          <ambientLight intensity={0.8} />
          {/* eslint-disable-next-line react/no-unknown-property */}
          <directionalLight position={[4, 4, 4]} intensity={0.9} />
          {/* eslint-disable-next-line react/no-unknown-property */}
          <directionalLight position={[-4, 2, -4]} intensity={0.5} />
          {/* 只有执行详情才需要交互控制器 */}
          {isDetail && <ControlsDemand url={url} />}
          <GLBModel url={url} scene={scene} />
          {!isDetail && <CaptureThumbnail enabled={!thumb} onCaptured={handleCaptured} />}
        </Canvas>
      )}

      {(loading || error) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#4B5563',
            pointerEvents: 'none',
          }}
        >
          {error ?? '模型加载中...'}
        </div>
      )}
    </div>
  );
}

export const VinesAbstract3DModel: React.FC<IVinesAbstract3DModelProps> = ({ children }) => {
  const url = children?.toString();
  const mode = useContext(Vines3DModelRenderModeContext);

  if (!url) return null;

  return <ModelViewer3D url={url} mode={mode} />;
};
