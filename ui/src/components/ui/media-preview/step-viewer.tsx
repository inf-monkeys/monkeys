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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  // 使用 Intersection Observer 检测组件是否在视口中
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 } // 当 10% 可见时触发
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // 只有在视口中时才初始化
    if (!containerRef.current || !isInView) return;

    let cancelled = false;

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(0);

        const container = containerRef.current;
        if (!container || cancelled) return;

        // 初始化 Three.js 场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        sceneRef.current = scene;

        // 相机设置
        const width = container.clientWidth;
        const height = container.clientHeight;
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(100, 100, 100);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // 渲染器设置
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 添加轨道控制器
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

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

        if (cancelled) return;

        setProgress(100);
        setIsLoading(false);

        // 动画循环
        const animate = () => {
          if (cancelled) return;
          animationIdRef.current = requestAnimationFrame(animate);
          controlsRef.current?.update();
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        };
        animate();

        // 处理窗口大小变化
        const handleResize = () => {
          if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading STEP file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load STEP file');
        setIsLoading(false);
      }
    };

    initViewer();

    // 清理函数
    return () => {
      cancelled = true;

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (sceneRef.current) {
        // 遍历场景中的所有对象并释放资源
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
          if (object instanceof THREE.LineSegments) {
            object.geometry?.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
        sceneRef.current = null;
      }
      if (rendererRef.current) {
        // 先移除 DOM 元素，再释放渲染器
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }

        // 尝试强制释放 WebGL 上下文
        try {
          const gl = rendererRef.current.getContext();
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            ext.loseContext();
          }
        } catch (e) {
          // 如果获取扩展失败，继续清理
        }

        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [src, isInView]); // 依赖于 src 和 isInView

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

      {/* 未进入视口的占位符 */}
      {!isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 rounded-full border-4 border-muted-foreground/20 mx-auto"></div>
            <p className="text-sm text-muted-foreground">STEP 模型</p>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isInView && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">加载 STEP 模型... {progress}%</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {isInView && error && (
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
