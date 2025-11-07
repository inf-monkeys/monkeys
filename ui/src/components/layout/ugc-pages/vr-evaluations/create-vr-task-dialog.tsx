import React, { useCallback, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { unzipSync } from 'fflate';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LoadingManager, Object3D, Scene } from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as z from 'zod';

import { createVRTask } from '@/apis/ugc/vr-evaluation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { uploadSingleFile } from '@/components/ui/vines-uploader/standalone';

interface CreateVRTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const createVRTaskSchema = z.object({
  taskName: z.string().min(1, '请输入任务名称'),
  modelUrl: z.string().url('请输入有效的 URL').min(1, '请输入模型文件链接'),
  thumbnailUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

type CreateVRTaskFormData = z.infer<typeof createVRTaskSchema>;

export const CreateVRTaskDialog: React.FC<CreateVRTaskDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [conversionState, setConversionState] = useState<'idle' | 'converting' | 'uploading'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [convertedFileName, setConvertedFileName] = useState<string>();
  const [selectedAssetNames, setSelectedAssetNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateVRTaskFormData>({
    resolver: zodResolver(createVRTaskSchema),
    defaultValues: {
      taskName: '',
      modelUrl: '',
      thumbnailUrl: '',
    },
  });

  const resetConversionIndicators = useCallback(() => {
    setConversionState('idle');
    setUploadProgress(0);
    setSelectedAssetNames([]);
  }, []);

  const normalizePathKey = (value: string) =>
    value
      .replace(/\\/g, '/')
      .replace(/^(\.\/)+/, '')
      .replace(/^\/+/, '');

  const buildAssetMap = (files: File[]) => {
    const map = new Map<string, File>();

    files.forEach((file) => {
      const rawPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const normalized = normalizePathKey(rawPath);
      const lower = normalized.toLowerCase();
      const baseName = normalized.split('/').pop() || normalized;
      const lowerBase = baseName.toLowerCase();

      map.set(normalized, file);
      map.set(lower, file);
      map.set(baseName, file);
      map.set(lowerBase, file);
    });

    return map;
  };

  const extractZipEntries = async (zipFile: File) => {
    const buffer = await zipFile.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(buffer));
    const extracted: File[] = [];

    Object.entries(unzipped).forEach(([path, content]) => {
      if (path.endsWith('/')) return;
      const normalized = normalizePathKey(path);
      const blob = new Blob([content], { type: 'application/octet-stream' });
      extracted.push(new File([blob], normalized));
    });

    if (!extracted.length) {
      throw new Error('压缩包中未找到可用的模型文件');
    }

    return extracted;
  };

  const convertSceneToUSDZ = useCallback(async (object: Object3D, fileName: string) => {
    const scene = new Scene();
    scene.add(object);

    const exporter = new USDZExporter();
    const arrayBuffer = await exporter.parseAsync(scene);
    const sanitizedName = `${fileName.replace(/\.[^/.]+$/, '')}.usdz`;

    return new File([arrayBuffer], sanitizedName, { type: 'model/vnd.usdz+zip' });
  }, []);

  const createAssetManager = (assetMap: Map<string, File>) => {
    const blobUrlCache = new Map<File, string>();
    const manager = new LoadingManager();

    const resolveAsset = (requestUrl: string) => {
      const clean = normalizePathKey(requestUrl.split(/[?#]/)[0]);
      return (
        assetMap.get(clean) ||
        assetMap.get(clean.toLowerCase()) ||
        assetMap.get(clean.split('/').pop() || '') ||
        assetMap.get((clean.split('/').pop() || '').toLowerCase())
      );
    };

    manager.setURLModifier((url) => {
      const asset = resolveAsset(url);
      if (asset) {
        if (!blobUrlCache.has(asset)) {
          blobUrlCache.set(asset, URL.createObjectURL(asset));
        }
        return blobUrlCache.get(asset)!;
      }
      return url;
    });

    return { manager, blobUrlCache };
  };

  const convertSingleFile = useCallback(
    async (file: File) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension) {
        throw new Error('无法识别的文件格式');
      }

      if (extension === 'usdz') {
        const buffer = await file.arrayBuffer();
        return new File([buffer], file.name, { type: 'model/vnd.usdz+zip' });
      }

      const arrayBuffer = await file.arrayBuffer();
      const assetMap = new Map<string, File>([[file.name, file]]);
      const { manager, blobUrlCache } = createAssetManager(assetMap);
      let loadedObject: Object3D | undefined;

      try {
        if (extension === 'glb' || extension === 'gltf') {
          const loader = new GLTFLoader(manager);
          loadedObject = await new Promise<Object3D>((resolve, reject) => {
            loader.parse(
              arrayBuffer,
              '',
              (gltf) => resolve(gltf.scene),
              (error) => reject(error),
            );
          });
        } else if (extension === 'obj') {
          const loader = new OBJLoader(manager);
          loadedObject = loader.parse(await file.text());
        } else if (extension === 'fbx') {
          const loader = new FBXLoader(manager);
          // FBXLoader.parse() expects ArrayBuffer and optional path for relative resource resolution
          loadedObject = loader.parse(arrayBuffer, file.name);
        } else {
          throw new Error(`暂不支持 ${extension} 格式的转换`);
        }

        if (!loadedObject) {
          throw new Error('模型加载失败');
        }

        return await convertSceneToUSDZ(loadedObject, file.name);
      } finally {
        blobUrlCache.forEach((value) => URL.revokeObjectURL(value));
        blobUrlCache.clear();
      }
    },
    [convertSceneToUSDZ],
  );

  const convertObjBundleToUSDZ = useCallback(
    async (files: File[], preferredName?: string) => {
      const objFile = files.find((file) => file.name.toLowerCase().endsWith('.obj'));
      if (!objFile) {
        throw new Error('多文件上传时必须包含 OBJ 模型文件');
      }

      const assetMap = buildAssetMap(files);
      const { manager, blobUrlCache } = createAssetManager(assetMap);

      let materialsCreator;
      const mtlFile = files.find((file) => file.name.toLowerCase().endsWith('.mtl'));
      if (mtlFile) {
        const mtlLoader = new MTLLoader(manager);
        materialsCreator = mtlLoader.parse(await mtlFile.text(), '');
        materialsCreator.preload();
      }

      const objLoader = new OBJLoader(manager);
      if (materialsCreator) {
        objLoader.setMaterials(materialsCreator);
      }

      try {
        const object = objLoader.parse(await objFile.text());
        return await convertSceneToUSDZ(object, preferredName || objFile.name);
      } finally {
        blobUrlCache.forEach((value) => URL.revokeObjectURL(value));
        blobUrlCache.clear();
      }
    },
    [convertSceneToUSDZ],
  );

  const convertFilesToUSDZ = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);
      if (!files.length) {
        throw new Error('请选择需要转换的模型文件');
      }

      if (files.length === 1) {
        const single = files[0];
        if (single.name.toLowerCase().endsWith('.zip')) {
          const extracted = await extractZipEntries(single);
          return convertObjBundleToUSDZ(extracted, single.name);
        }
        return convertSingleFile(single);
      }

      return convertObjBundleToUSDZ(files);
    },
    [convertObjBundleToUSDZ, convertSingleFile],
  );

  const handleModelConversion = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      setSelectedAssetNames(Array.from(files).map((f) => f.name));
      setConversionState('converting');
      setUploadProgress(0);

      try {
        const usdzFile = await convertFilesToUSDZ(files);

        setConversionState('uploading');
        const { urls } = await uploadSingleFile(usdzFile, {
          basePath: 'vr-models',
          onProgress: (progress) => setUploadProgress(progress),
        });

        const [uploadedUrl] = urls;
        if (!uploadedUrl) {
          throw new Error('文件上传失败');
        }

        form.setValue('modelUrl', uploadedUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        setConvertedFileName(usdzFile.name);
        toast.success('模型已转换并上传');
      } catch (error) {
        console.error('模型转换失败', error);
        toast.error(error instanceof Error ? error.message : '模型转换失败，请检查文件格式');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        resetConversionIndicators();
      }
    },
    [convertFilesToUSDZ, form, resetConversionIndicators],
  );

  const onSubmit = async (data: CreateVRTaskFormData) => {
    setLoading(true);
    try {
      await createVRTask({
        taskName: data.taskName,
        modelUrl: data.modelUrl,
        thumbnailUrl: data.thumbnailUrl || undefined,
      });

      toast.success('VR 评测任务创建成功');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create VR task:', error);
      toast.error('创建 VR 评测任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建 VR 评测任务</DialogTitle>
          <DialogDescription>创建一个虚拟现实环境中的 3D 模型评测任务</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：一个家用扫地机器人" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模型文件链接 (USDZ) *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/model.usdz" {...field} />
                  </FormControl>
                  <FormDescription>支持 USDZ 格式的 3D 模型文件，可在 Vision Pro 中查看</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>缩略图链接（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 rounded-lg border p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">模型转换</h4>
                  <p className="text-xs text-muted-foreground">
                    支持上传 glb/gltf/obj/fbx/usdz 等单个文件，或同时选择多个文件（OBJ+MTL+贴图）或 ZIP
                    打包，转换后会自动上传并回填链接。
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={conversionState !== 'idle'}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    选择文件
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={conversionState !== 'idle'}
                    onClick={() => folderInputRef.current?.click()}
                    className="flex-1"
                  >
                    选择文件夹
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".glb,.gltf,.obj,.fbx,.usdz,.zip"
                className="hidden"
                onChange={handleModelConversion}
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory
                className="hidden"
                onChange={handleModelConversion}
              />
              {selectedAssetNames.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-md bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                  <p className="mb-1 text-xs">已选择 {selectedAssetNames.length} 个文件：</p>
                  {selectedAssetNames.map((name) => (
                    <div key={name}>{name}</div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {conversionState === 'converting' && <span>正在转换模型，请稍候...</span>}
                {conversionState === 'uploading' && <span>正在上传 USDZ 文件（{uploadProgress.toFixed(0)}%）</span>}
                {conversionState === 'idle' && convertedFileName && (
                  <span className="text-green-600">已生成并上传：{convertedFileName}</span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t('common.utils.cancel')}
              </Button>
              <Button type="submit" variant="outline" loading={loading}>
                {t('common.utils.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
