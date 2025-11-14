import React, { useState } from 'react';

import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { identifyAndMeasureGarment, imageFileToBase64 } from '@/apis/pom';
import { GarmentType, MeasurementTableRow } from '@/apis/pom/typings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { MeasurementTable } from './measurement-table';

export const PomPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [garmentType, setGarmentType] = useState<GarmentType | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementTableRow[]>([]);
  // 控制左侧上传区域是否可见，用于在结果区域拥挤时折叠上传区
  const [showUploader, setShowUploader] = useState(true);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // 验证文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setImageFile(file);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 清除之前的结果
    setGarmentType(null);
    setMeasurements([]);
  };

  // 处理测量
  const handleMeasure = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);

    try {
      // 转换图片为 Base64
      const base64Image = await imageFileToBase64(imageFile);

      // 调用 API
      const response = await identifyAndMeasureGarment({
        image: base64Image,
      });

      if (response.success) {
        setGarmentType(response.data.garment_type);
        setMeasurements(response.data.measurements_table);
        toast.success(`Successfully measured ${response.data.garment_type}`);
      } else {
        toast.error(response.message || 'Failed to measure garment');
      }
    } catch (error) {
      console.error('Measurement error:', error);
      toast.error('An error occurred while measuring the garment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">POM - Product on Model</h1>
        <p className="text-muted-foreground">Measure garment dimensions using AI</p>
      </div>

      {/* 自适应 12 栅格布局，右侧结果区可获得更多空间 */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* 左侧：图片上传区域 */}
        {showUploader && (
          <div className="xl:col-span-4">
            <Card>
              <CardHeader className="flex flex-row items-start gap-2">
                <div className="flex-1">
                  <CardTitle>Upload Garment Image</CardTitle>
                  <CardDescription>
                    Upload a flat lay photo of the garment (PNG, JPEG, WEBP, JFIF)
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploader(false)}
                  className="shrink-0"
                >
                  Hide
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 图片预览 */}
                {imagePreview ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
                    <img src={imagePreview} alt="Garment preview" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No image selected</p>
                    </div>
                  </div>
                )}

                {/* 文件选择按钮 */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/jfif"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </Button>

                  <Button className="flex-1" onClick={handleMeasure} disabled={!imageFile || loading}>
                    {loading ? 'Measuring...' : 'Measure Garment'}
                  </Button>
                </div>

                {/* 提示信息 */}
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium">Tips:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Use a flat lay photo for best results</li>
                    <li>Ensure good lighting and clear image</li>
                    <li>Maximum file size: 20MB</li>
                    <li>Supported formats: PNG, JPEG, JPG, WEBP, JFIF</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 右侧：测量结果 */}
        <div className={showUploader ? 'xl:col-span-8' : 'xl:col-span-12'}>
          <Card>
            <CardHeader className="flex flex-row items-start gap-2">
              <div className="flex-1">
                <CardTitle>Measurement Results</CardTitle>
                <CardDescription>
                  {garmentType ? `Detected: ${garmentType}` : 'Results will appear here after measurement'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploader((v) => !v)}
                className="shrink-0"
              >
                {showUploader ? 'Expand Results' : 'Show Uploader'}
              </Button>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 && garmentType ? (
                <MeasurementTable measurements={measurements} garmentType={garmentType} loading={loading} />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center text-sm text-muted-foreground">
                    <p>No measurements yet</p>
                    <p className="mt-2">Upload an image and click &quot;Measure Garment&quot; to get started</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
