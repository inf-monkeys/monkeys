import React, { useCallback, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Object3D, Scene } from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const convertFileToUSDZ = useCallback(async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      throw new Error('无法识别的文件格式');
    }

    if (extension === 'usdz') {
      const buffer = await file.arrayBuffer();
      return new File([buffer], file.name, { type: 'model/vnd.usdz+zip' });
    }

    const scene = new Scene();

    const loadWithGLTFLoader = async () => {
      const loader = new GLTFLoader();
      const arrayBuffer = await file.arrayBuffer();
      return await new Promise<Object3D>((resolve, reject) => {
        loader.parse(
          arrayBuffer,
          '',
          (gltf) => resolve(gltf.scene),
          (error) => reject(error),
        );
      });
    };

    const loadWithOBJLoader = async () => {
      const loader = new OBJLoader();
      const text = await file.text();
      return loader.parse(text);
    };

    const loadWithFBXLoader = async () => {
      const loader = new FBXLoader();
      const arrayBuffer = await file.arrayBuffer();
      return loader.parse(arrayBuffer, '');
    };

    let loadedObject: Object3D | undefined;

    if (extension === 'glb' || extension === 'gltf') {
      loadedObject = await loadWithGLTFLoader();
    } else if (extension === 'obj') {
      loadedObject = await loadWithOBJLoader();
    } else if (extension === 'fbx') {
      loadedObject = await loadWithFBXLoader();
    } else {
      throw new Error(`暂不支持 ${extension} 格式的转换`);
    }

    if (!loadedObject) {
      throw new Error('模型加载失败');
    }

    scene.add(loadedObject);

    const exporter = new USDZExporter();
    const arrayBuffer = await exporter.parse(scene);
    const fileName = `${file.name.replace(/\.[^/.]+$/, '')}.usdz`;

    return new File([arrayBuffer], fileName, { type: 'model/vnd.usdz+zip' });
  }, []);

  const handleModelConversion = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setConversionState('converting');
      setUploadProgress(0);

      try {
        const usdzFile = await convertFileToUSDZ(file);

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
    [convertFileToUSDZ, form, resetConversionIndicators],
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
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">模型转换</h4>
                  <p className="text-xs text-muted-foreground">
                    支持上传 glb/gltf/obj/fbx/usdz，转换后会自动上传并回填链接。
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={conversionState !== 'idle'}
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择文件
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx,.usdz"
                  className="hidden"
                  onChange={handleModelConversion}
                />
              </div>
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
