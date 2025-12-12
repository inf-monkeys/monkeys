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

// 视角缓存（按 URL）
const viewStateCache = new Map<string, ViewState>();

// 模型缓存（按 URL）
const sceneCache = new Map<string, THREE.Group>();
const inflight = new Map<string, Promise<THREE.Group>>();

// 缩略图缓存（按 URL）：列表展示用，解决多 Canvas 闪烁
const thumbnailCache = new Map<string, string>();

async function loadScene(url: string): Promise<THREE.Group> {
  const cached = sceneCache.get(url);
  if (cached) return cached;

  const inflightPromise = inflight.get(url);
  if (inflightPromise) return inflightPromise;

  const p = new Promise<THREE.Group>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const scene = (gltf as any)?.scene || (gltf as any)?.scenes?.[0];
        if (!scene) {
          reject(new Error('模型为空'));
          return;
        }
        const group = scene as THREE.Group;
        sceneCache.set(url, group);
        resolve(group);
      },
      undefined,
      (e) => reject(e),
    );
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

    let raf1 = 0;
    let raf2 = 0;

    // demand 模式下两帧后截屏
    invalidate();
    raf1 = requestAnimationFrame(() => {
      invalidate();
      raf2 = requestAnimationFrame(() => {
        try {
          const dataUrl = gl.domElement.toDataURL('image/png');
          if (dataUrl) onCaptured(dataUrl);
        } catch {
          // ignore
        }
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
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
        height: isDetail ? '320px' : '240px',
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

  return (
    <div className="flex flex-col gap-2">
      <ModelViewer3D url={url} mode={mode} />
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="font-medium">3D 模型</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      </div>
    </div>
  );
};
