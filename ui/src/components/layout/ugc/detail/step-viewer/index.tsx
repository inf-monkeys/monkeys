import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import occtimportjs from 'occt-import-js';
import * as THREE from 'three';

import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils';

export interface StepViewerRef {
  captureScreenshot: () => Promise<Blob | null>;
}

interface StepViewerProps {
  url: string;
  className?: string;
  onReady?: () => void;
}

interface ModelProps {
  geometry: THREE.BufferGeometry;
}

const Model: React.FC<ModelProps> = ({ geometry }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (groupRef.current && geometry) {
      // 计算边界
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const boundingBox = geometry.boundingBox;
      const boundingSphere = geometry.boundingSphere;

      if (boundingBox && boundingSphere) {
        // 获取模型中心
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        // 获取模型尺寸
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // 计算缩放比例，使模型适合视图
        const desiredSize = 8; // 期望的最大尺寸
        const scale = maxDim > 0 ? desiredSize / maxDim : 1;

        // 应用变换到 group
        groupRef.current.scale.setScalar(scale);
        groupRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        // 调整相机位置以查看整个模型
        const distance = boundingSphere.radius * scale * 2.5;
        camera.position.set(distance, distance, distance);
        camera.lookAt(0, 0, 0);
      }
    }
  }, [geometry, camera]);

  return (
    <group ref={groupRef}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <mesh geometry={geometry}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <meshStandardMaterial color="#888888" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Scene: React.FC<{ geometry: THREE.BufferGeometry | null }> = ({ geometry }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <ambientLight intensity={0.5} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <directionalLight position={[10, 10, 10]} intensity={1} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <directionalLight position={[-10, -10, -10]} intensity={0.5} />
      {geometry && <Model geometry={geometry} />}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <gridHelper args={[10, 10]} />
    </>
  );
};

export const StepViewer = React.forwardRef<StepViewerRef, StepViewerProps>(({ url, className, onReady }, ref) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const occtRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    captureScreenshot: async () => {
      if (!canvasRef.current) {
        return null;
      }
      try {
        return new Promise<Blob | null>((resolve, reject) => {
          const canvas = canvasRef.current;
          if (!canvas) {
            reject(new Error('Canvas not found'));
            return;
          }
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob from canvas'));
                }
              },
              'image/png',
              1.0,
            );
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        return null;
      }
    },
  }));

  useEffect(() => {
    let mounted = true;

    const loadStepFile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 初始化 occt-import-js
        if (!occtRef.current) {
          occtRef.current = await occtimportjs({
            locateFile: (file: string) => {
              return `/occt-import-js/${file}`;
            },
          });
        }

        // 获取 STEP 文件
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch STEP file');
        }

        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // 解析 STEP 文件
        const result = occtRef.current.ReadStepFile(fileBuffer, null);

        if (!result.success) {
          throw new Error('Failed to parse STEP file');
        }

        // 转换为 Three.js 几何体
        const vertices: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];

        // 遍历所有面片
        for (let i = 0; i < result.meshes.length; i++) {
          const mesh = result.meshes[i];
          const baseIndex = vertices.length / 3;

          // 添加顶点
          for (let j = 0; j < mesh.attributes.position.array.length; j++) {
            vertices.push(mesh.attributes.position.array[j]);
          }

          // 添加法线
          if (mesh.attributes.normal) {
            for (let j = 0; j < mesh.attributes.normal.array.length; j++) {
              normals.push(mesh.attributes.normal.array[j]);
            }
          }

          // 添加索引
          if (mesh.index) {
            for (let j = 0; j < mesh.index.array.length; j++) {
              indices.push(mesh.index.array[j] + baseIndex);
            }
          }
        }

        if (!mounted) return;

        // 创建 Three.js 几何体
        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        if (normals.length > 0) {
          bufferGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        } else {
          bufferGeometry.computeVertexNormals();
        }
        if (indices.length > 0) {
          bufferGeometry.setIndex(indices);
        }

        bufferGeometry.computeBoundingSphere();
        setGeometry(bufferGeometry);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          // 延迟调用 onReady，确保渲染完成
          setTimeout(() => {
            if (mounted && onReady) {
              onReady();
            }
          }, 100);
        }
      }
    };

    void loadStepFile();

    return () => {
      mounted = false;
    };
  }, [url, onReady]);

  if (loading) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-black',
          className,
        )}
      >
        <VinesLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-black',
          className,
        )}
      >
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-red-500">加载失败</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-full w-full rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-black',
        className,
      )}
    >
      <Canvas
        gl={{
          preserveDrawingBuffer: true, // 重要：保留绘图缓冲区，用于截图
          antialias: true,
        }}
        onCreated={({ gl }) => {
          // 保存 canvas 引用
          canvasRef.current = gl.domElement;
        }}
      >
        <Scene geometry={geometry} />
      </Canvas>
    </div>
  );
});

StepViewer.displayName = 'StepViewer';
