import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';

import { nanoIdUpperCase } from '@/utils';

// WebGPU type definitions for TypeScript
declare global {
  interface Navigator {
    gpu?: GPU;
  }

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  }

  interface GPUAdapter {
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  }

  interface GPUDevice {
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createCommandEncoder(): GPUCommandEncoder;
    queue: GPUQueue;
    destroy(): void;
  }

  interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayBufferView): void;
    submit(commandBuffers: GPUCommandBuffer[]): void;
  }

  interface GPUBuffer {
    destroy(): void;
    mapAsync(mode: number): Promise<void>;
    getMappedRange(): ArrayBuffer;
    unmap(): void;
  }

  interface GPUComputePipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }

  interface GPUCommandEncoder {
    beginComputePass(): GPUComputePassEncoder;
    copyBufferToBuffer(
      source: GPUBuffer,
      sourceOffset: number,
      destination: GPUBuffer,
      destinationOffset: number,
      size: number,
    ): void;
    finish(): GPUCommandBuffer;
  }

  interface GPUComputePassEncoder {
    setPipeline(pipeline: GPUComputePipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void;
    end(): void;
  }

  const GPUBufferUsage: {
    STORAGE: number;
    COPY_DST: number;
    COPY_SRC: number;
    MAP_READ: number;
    UNIFORM: number;
  };

  const GPUMapMode: {
    READ: number;
  };

  // Additional interfaces
  interface GPURequestAdapterOptions {}
  interface GPUDeviceDescriptor {}
  interface GPUShaderModuleDescriptor {
    code: string;
  }
  interface GPUComputePipelineDescriptor {
    layout: string;
    compute: { module: GPUShaderModule; entryPoint: string };
  }
  interface GPUBufferDescriptor {
    size: number;
    usage: number;
  }
  interface GPUBindGroupDescriptor {
    layout: GPUBindGroupLayout;
    entries: GPUBindGroupEntry[];
  }
  interface GPUBindGroupEntry {
    binding: number;
    resource: { buffer: GPUBuffer };
  }
  interface GPUShaderModule {}
  interface GPUBindGroup {}
  interface GPUBindGroupLayout {}
  interface GPUCommandBuffer {}
}

// WebGPU compute shader for applying mask to image
const WEBGPU_COMPUTE_SHADER = `
struct ImageDimensions {
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> dimensions: ImageDimensions;
@group(0) @binding(1) var<storage, read> originalImage: array<u32>;
@group(0) @binding(2) var<storage, read> maskImage: array<u32>;
@group(0) @binding(3) var<storage, read_write> resultImage: array<u32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    if (x >= dimensions.width || y >= dimensions.height) {
        return;
    }
    
    let index = y * dimensions.width + x;
    
    // Get original pixel
    let originalPixel = originalImage[index];
    
    // Get mask pixel
    let maskPixel = maskImage[index];
    
    // Extract alpha channel from mask (bits 24-31)
    let maskAlpha = (maskPixel >> 24u) & 0xFFu;
    
    // If mask alpha > 0, set original alpha to 0, otherwise keep original
    var resultPixel = originalPixel;
    if (maskAlpha > 0u) {
        // Clear alpha channel (set bits 24-31 to 0)
        resultPixel = originalPixel & 0x00FFFFFFu;
    }
    
    resultImage[index] = resultPixel;
}
`;

class WebGPUMaskProcessor {
  private device: GPUDevice | null = null;
  private pipeline: GPUComputePipeline | null = null;
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.warn('WebGPU not supported');
        return false;
      }

      // Request adapter and device
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn('WebGPU adapter not available');
        return false;
      }

      this.device = await adapter.requestDevice();
      if (!this.device) {
        console.warn('WebGPU device not available');
        return false;
      }

      // Create compute pipeline
      const shaderModule = this.device.createShaderModule({
        code: WEBGPU_COMPUTE_SHADER,
      });

      this.pipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize WebGPU:', error);
      return false;
    }
  }

  async processImage(
    originalImageData: ImageData,
    maskImageData: ImageData,
    onProgress?: (progress: number) => void,
  ): Promise<ImageData> {
    if (!this.device || !this.pipeline) {
      throw new Error('WebGPU not initialized');
    }

    const { width, height } = originalImageData;
    const pixelCount = width * height;

    onProgress?.(10);

    // Convert ImageData to Uint32Array for GPU processing
    const originalPixels = new Uint32Array(originalImageData.data.buffer);
    const maskPixels = new Uint32Array(maskImageData.data.buffer);
    const resultPixels = new Uint32Array(pixelCount);

    onProgress?.(20);

    // Create uniform buffer for image dimensions
    const dimensionsData = new Uint32Array([width, height]);
    const dimensionsBuffer = this.device.createBuffer({
      size: dimensionsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create GPU buffers
    const originalBuffer = this.device.createBuffer({
      size: originalPixels.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const maskBuffer = this.device.createBuffer({
      size: maskPixels.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const resultBuffer = this.device.createBuffer({
      size: resultPixels.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const readBuffer = this.device.createBuffer({
      size: resultPixels.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    onProgress?.(30);

    // Write data to GPU buffers
    this.device.queue.writeBuffer(dimensionsBuffer, 0, dimensionsData);
    this.device.queue.writeBuffer(originalBuffer, 0, originalPixels);
    this.device.queue.writeBuffer(maskBuffer, 0, maskPixels);

    onProgress?.(40);

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: dimensionsBuffer } },
        { binding: 1, resource: { buffer: originalBuffer } },
        { binding: 2, resource: { buffer: maskBuffer } },
        { binding: 3, resource: { buffer: resultBuffer } },
      ],
    });

    onProgress?.(50);

    // Create command encoder and dispatch compute shader
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    // Dispatch with appropriate workgroup size
    const workgroupsX = Math.ceil(width / 8);
    const workgroupsY = Math.ceil(height / 8);
    passEncoder.dispatchWorkgroups(workgroupsX, workgroupsY);

    passEncoder.end();

    // Copy result to read buffer
    commandEncoder.copyBufferToBuffer(resultBuffer, 0, readBuffer, 0, resultPixels.byteLength);

    onProgress?.(70);

    // Submit commands and wait for completion
    this.device.queue.submit([commandEncoder.finish()]);

    onProgress?.(80);

    // Read result back from GPU
    await readBuffer.mapAsync(GPUMapMode.READ);
    const resultData = new Uint32Array(readBuffer.getMappedRange());

    // Convert back to ImageData format
    const resultImageData = new ImageData(width, height);
    const resultBytes = new Uint8Array(resultData.buffer);
    resultImageData.data.set(resultBytes);

    readBuffer.unmap();

    onProgress?.(90);

    // Cleanup GPU resources
    dimensionsBuffer.destroy();
    originalBuffer.destroy();
    maskBuffer.destroy();
    resultBuffer.destroy();
    readBuffer.destroy();

    onProgress?.(100);

    return resultImageData;
  }

  destroy() {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.pipeline = null;
    this.initialized = false;
  }
}

// Singleton instance
let webgpuProcessor: WebGPUMaskProcessor | null = null;

export const canvasToBlob = (canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      type,
      quality,
    );
  });
};

export const getCanvasBlob: (canvas: HTMLCanvasElement) => Promise<Blob | null> = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve));

export const applyMaskCanvasToOriginalImageFileWebGPU = async (
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  // Initialize WebGPU processor if needed
  if (!webgpuProcessor) {
    webgpuProcessor = new WebGPUMaskProcessor();
  }

  const initialized = await webgpuProcessor.initialize();
  if (!initialized) {
    throw new Error('WebGPU initialization failed. Please ensure your browser supports WebGPU.');
  }

  onProgress?.(5);

  // Create a temporary canvas for loading original image
  const originalCanvas = document.createElement('canvas');
  const originalCtx = originalCanvas.getContext('2d');

  if (!originalCtx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // Load original image
  const originalImage = new Image();
  originalImage.src = URL.createObjectURL(file);
  await new Promise((resolve) => (originalImage.onload = resolve));

  // Set original canvas size to actual image size
  originalCanvas.width = originalImage.width;
  originalCanvas.height = originalImage.height;
  originalCtx.drawImage(originalImage, 0, 0);

  onProgress?.(10);

  // Create a temporary canvas for scaling mask
  const scaledMaskCanvas = document.createElement('canvas');
  const scaledMaskCtx = scaledMaskCanvas.getContext('2d');

  if (!scaledMaskCtx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // Set scaled mask canvas size to original image size
  scaledMaskCanvas.width = originalImage.width;
  scaledMaskCanvas.height = originalImage.height;

  // Clear scaled canvas
  scaledMaskCtx.clearRect(0, 0, scaledMaskCanvas.width, scaledMaskCanvas.height);

  // Scale mask canvas to original image size
  const maskCanvas = maskCanvasCtx.canvas;
  scaledMaskCtx.drawImage(
    maskCanvas,
    0,
    0,
    maskCanvas.width,
    maskCanvas.height,
    0,
    0,
    originalImage.width,
    originalImage.height,
  );

  onProgress?.(15);

  // Get ImageData from both canvases
  const originalImageData = originalCtx.getImageData(0, 0, originalImage.width, originalImage.height);
  const maskImageData = scaledMaskCtx.getImageData(0, 0, originalImage.width, originalImage.height);

  onProgress?.(20);

  // Process with WebGPU
  const resultImageData = await webgpuProcessor.processImage(
    originalImageData,
    maskImageData,
    (progress) => onProgress?.(20 + progress * 0.7), // Map 0-100 to 20-90
  );

  // Create result canvas and put processed data
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = originalImage.width;
  resultCanvas.height = originalImage.height;
  const resultCtx = resultCanvas.getContext('2d');

  if (!resultCtx) {
    throw new Error('无法获取结果 Canvas 上下文');
  }

  resultCtx.putImageData(resultImageData, 0, 0);

  onProgress?.(95);

  // Convert to blob
  const resultBlob = await canvasToBlob(resultCanvas, 'image/png');
  if (!resultBlob) {
    throw new Error('Failed to create result blob');
  }

  onProgress?.(100);

  // Cleanup
  URL.revokeObjectURL(originalImage.src);

  return resultBlob;
};

export const mergeBlobToFile = (file: File, blob: Blob): File => {
  const fileNameAndExtension = getFileNameAndExtension(file.name);

  let maskFileName = fileNameAndExtension?.name ?? nanoIdUpperCase(6);
  const maskFileExtension = fileNameAndExtension?.extension ?? 'png';

  maskFileName = `${maskFileName}_mask-edited-webgpu_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${maskFileExtension}`;

  const maskFile = new File([blob], maskFileName, { type: 'image/png' }) as FileWithPath;
  set(maskFile, 'path', maskFileName);
  return maskFile;
};

// Cleanup function to be called when component unmounts
export const cleanupWebGPU = () => {
  if (webgpuProcessor) {
    webgpuProcessor.destroy();
    webgpuProcessor = null;
  }
};
