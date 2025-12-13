import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import occtimportjs from 'occt-import-js';
import { cn } from '@/utils';

export interface StepViewerProps {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function StepViewer({
  src,
  alt = 'STEP model preview',
  className,
  aspectRatio = 'square',
}: StepViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(0);

        const container = containerRef.current;
        if (!container) return;

        // 初始化 Three.js 场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);

        // 相机设置
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(100, 100, 100);
        camera.lookAt(0, 0, 0);

        // 渲染器设置
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // 添加轨道控制器
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-1, -1, -1);
        scene.add(directionalLight2);

        // 添加网格
        const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
        scene.add(gridHelper);

        setProgress(20);

        // 初始化 OCCT，配置 WASM 文件路径
        const occt = await occtimportjs({
          locateFile: (file: string) => {
            // Vite 会将 public 目录的文件复制到根目录
            if (file.endsWith('.wasm') || file.endsWith('.js')) {
              return `/${file}`;
            }
            return file;
          },
        });
        setProgress(40);

        // 加载 STEP 文件
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to load STEP file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);
        setProgress(60);

        // 读取 STEP 文件
        const result = occt.ReadStepFile(fileBuffer, null);
        setProgress(80);

        if (!result.success) {
          throw new Error('Failed to parse STEP file');
        }

        // 创建材质
        const material = new THREE.MeshPhongMaterial({
          color: 0x4a90e2,
          side: THREE.DoubleSide,
          flatShading: false,
        });

        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x222222,
          linewidth: 1,
        });

        // 计算边界盒用于居中和缩放
        const bbox = new THREE.Box3();

        // 遍历所有网格并添加到场景
        for (let i = 0; i < result.meshes.length; i++) {
          const mesh = result.meshes[i];

          // 创建几何体
          const geometry = new THREE.BufferGeometry();

          // 设置顶点
          const vertices = new Float32Array(mesh.attributes.position.array);
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

          // 设置法线
          if (mesh.attributes.normal) {
            const normals = new Float32Array(mesh.attributes.normal.array);
            geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          } else {
            geometry.computeVertexNormals();
          }

          // 设置索引
          if (mesh.index) {
            const indices = new Uint32Array(mesh.index.array);
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
          }

          // 创建网格并添加到场景
          const threeMesh = new THREE.Mesh(geometry, material);
          scene.add(threeMesh);

          // 添加边线
          const edges = new THREE.EdgesGeometry(geometry, 30);
          const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
          threeMesh.add(edgeLines);

          // 更新边界盒
          geometry.computeBoundingBox();
          if (geometry.boundingBox) {
            bbox.union(geometry.boundingBox);
          }
        }

        // 居中模型
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // 调整相机位置
        camera.position.set(
          center.x + maxDim * 1.5,
          center.y + maxDim * 1.5,
          center.z + maxDim * 1.5
        );
        camera.lookAt(center);
        controls.target.copy(center);

        setProgress(100);
        setIsLoading(false);

        // 动画循环
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // 处理窗口大小变化
        const handleResize = () => {
          if (!containerRef.current) return;
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('Error loading STEP file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load STEP file');
        setIsLoading(false);
      }
    };

    initViewer();

    // 清理函数
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
      }
      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [src]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  const containerClass = cn(
    'w-full overflow-hidden bg-muted relative',
    aspectClasses[aspectRatio],
    className
  );

  return (
    <div className={containerClass} style={{ minHeight: aspectRatio === 'square' ? 'auto' : '400px' }}>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">加载 STEP 模型... {progress}%</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center px-4">
            <p className="text-sm text-destructive mb-2">加载失败</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
