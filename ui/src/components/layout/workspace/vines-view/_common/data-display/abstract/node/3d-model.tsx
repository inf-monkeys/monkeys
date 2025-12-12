import React, { useCallback, useEffect, useRef, useState } from 'react';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstract3DModelProps {
  children: JSONValue;
}

function GLBModel({
  url,
  onLoaded,
  onError,
}: {
  url: string;
  onLoaded: () => void;
  onError: (message: string) => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        const scene = (gltf as any).scene || (gltf as any).scenes?.[0];
        if (!scene) {
          onError('模型为空');
          return;
        }
        setModel(scene.clone(true));
        onLoaded();
      },
      undefined,
      (error) => {
        if (cancelled) return;
        console.error('3D model load failed', error);
        onError('模型加载失败');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url, onError, onLoaded]);

  useEffect(() => {
    if (!model || !groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxDim * 1.8;
    const scale = 2 / maxDim;

    groupRef.current.position.set(-center.x, -center.y, -center.z);
    groupRef.current.scale.setScalar(scale);
    camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    camera.lookAt(0, 0, 0);
  }, [model, camera]);

  if (!model) return null;

  return (
    // eslint-disable-next-line react/no-unknown-property
    <primitive ref={groupRef} object={model} />
  );
}

function ModelViewer3D({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stopScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // 避免画布跟随滚动，同时允许 3D 视图缩放
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [url]);

  const handleLoaded = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '240px',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative',
        overscrollBehavior: 'contain',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onWheel={stopScroll}
      onWheelCapture={stopScroll}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <color attach="background" args={['#F8FAFC']} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <ambientLight intensity={0.8} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight position={[4, 4, 4]} intensity={0.9} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight position={[-4, 2, -4]} intensity={0.5} />
        <OrbitControls enableDamping dampingFactor={0.08} enablePan enableZoom />
        <GLBModel url={url} onLoaded={handleLoaded} onError={handleError} />
      </Canvas>

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

  if (!url) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <ModelViewer3D url={url} />
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
