import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';

import { nanoIdUpperCase } from '@/utils';

import { applyMaskCanvasToOriginalImageFile as applyMaskCanvasToOriginalImageFileOriginal } from './utils';
import { applyMaskCanvasToOriginalImageFileWebGL, cleanupWebGL } from './utils-webgl';
// Import the optimized implementations
import { applyMaskCanvasToOriginalImageFileWebGPU, cleanupWebGPU } from './utils-webgpu';

export enum ProcessingMethod {
  WEBGPU = 'webgpu',
  WEBGL = 'webgl',
  ORIGINAL = 'original',
}

interface ProcessingCapabilities {
  webgpu: boolean;
  webgl: boolean;
}

class OptimizedMaskProcessor {
  private capabilities: ProcessingCapabilities | null = null;
  private preferredMethod: ProcessingMethod | null = null;

  async detectCapabilities(): Promise<ProcessingCapabilities> {
    if (this.capabilities) return this.capabilities;

    const capabilities: ProcessingCapabilities = {
      webgpu: false,
      webgl: false,
    };

    // Test WebGPU support
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          const device = await adapter.requestDevice();
          if (device) {
            capabilities.webgpu = true;
            device.destroy();
          }
        }
      }
    } catch (error) {
      console.debug('WebGPU not available:', error);
    }

    // Test WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        capabilities.webgl = true;
      }
    } catch (error) {
      console.debug('WebGL not available:', error);
    }

    this.capabilities = capabilities;
    return capabilities;
  }

  async getOptimalMethod(imageSize?: { width: number; height: number }): Promise<ProcessingMethod> {
    if (this.preferredMethod) return this.preferredMethod;

    const capabilities = await this.detectCapabilities();

    // For large images, prefer GPU acceleration
    const isLargeImage = imageSize && imageSize.width * imageSize.height > 1024 * 1024;

    if (capabilities.webgpu && (isLargeImage || !capabilities.webgl)) {
      this.preferredMethod = ProcessingMethod.WEBGPU;
    } else if (capabilities.webgl) {
      this.preferredMethod = ProcessingMethod.WEBGL;
    } else {
      this.preferredMethod = ProcessingMethod.ORIGINAL;
    }

    return this.preferredMethod;
  }

  async processImage(
    file: File,
    maskCanvasCtx: CanvasRenderingContext2D,
    onProgress?: (progress: number) => void,
    forceMethod?: ProcessingMethod,
  ): Promise<{ blob: Blob; method: ProcessingMethod }> {
    // Get image dimensions for optimal method selection
    const imageSize = await this.getImageSize(file);
    const method = forceMethod || (await this.getOptimalMethod(imageSize));

    let blob: Blob;
    let actualMethod = method;

    try {
      switch (method) {
        case ProcessingMethod.WEBGPU:
          try {
            blob = await applyMaskCanvasToOriginalImageFileWebGPU(file, maskCanvasCtx, onProgress);
            break;
          } catch (error) {
            console.warn('WebGPU processing failed, falling back to WebGL:', error);
            actualMethod = ProcessingMethod.WEBGL;
            blob = await applyMaskCanvasToOriginalImageFileWebGL(file, maskCanvasCtx, onProgress);
            break;
          }

        case ProcessingMethod.WEBGL:
          try {
            blob = await applyMaskCanvasToOriginalImageFileWebGL(file, maskCanvasCtx, onProgress);
            break;
          } catch (error) {
            console.warn('WebGL processing failed, falling back to original:', error);
            actualMethod = ProcessingMethod.ORIGINAL;
            blob = (await applyMaskCanvasToOriginalImageFileOriginal(file, maskCanvasCtx, onProgress)) as Blob;
            break;
          }

        case ProcessingMethod.ORIGINAL:
        default:
          blob = (await applyMaskCanvasToOriginalImageFileOriginal(file, maskCanvasCtx, onProgress)) as Blob;
          break;
      }
    } catch (error) {
      // Final fallback to original method
      if (actualMethod !== ProcessingMethod.ORIGINAL) {
        console.warn('All GPU methods failed, using original implementation:', error);
        blob = (await applyMaskCanvasToOriginalImageFileOriginal(file, maskCanvasCtx, onProgress)) as Blob;
        actualMethod = ProcessingMethod.ORIGINAL;
      } else {
        throw error;
      }
    }

    return { blob, method: actualMethod };
  }

  private async getImageSize(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  cleanup() {
    cleanupWebGPU();
    cleanupWebGL();
    this.capabilities = null;
    this.preferredMethod = null;
  }
}

// Singleton instance
let optimizedProcessor: OptimizedMaskProcessor | null = null;

function getProcessor(): OptimizedMaskProcessor {
  if (!optimizedProcessor) {
    optimizedProcessor = new OptimizedMaskProcessor();
  }
  return optimizedProcessor;
}

/**
 * Optimized mask application function with automatic GPU acceleration
 * Falls back gracefully from WebGPU -> WebGL -> Original implementation
 */
export const applyMaskCanvasToOriginalImageFileOptimized = async (
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
  forceMethod?: ProcessingMethod,
): Promise<Blob> => {
  const processor = getProcessor();
  const result = await processor.processImage(file, maskCanvasCtx, onProgress, forceMethod);

  // Log the method used for debugging
  console.debug(`Image processing completed using: ${result.method}`);

  return result.blob;
};

/**
 * Get processing capabilities of the current browser
 */
export const getProcessingCapabilities = async (): Promise<ProcessingCapabilities & { optimal: ProcessingMethod }> => {
  const processor = getProcessor();
  const capabilities = await processor.detectCapabilities();
  const optimal = await processor.getOptimalMethod();

  return {
    ...capabilities,
    optimal,
  };
};

/**
 * Benchmark different processing methods (for development/testing)
 */
export const benchmarkProcessingMethods = async (
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
): Promise<Record<ProcessingMethod, { time: number; success: boolean; error?: string }>> => {
  const processor = getProcessor();
  const results: Record<ProcessingMethod, { time: number; success: boolean; error?: string }> = {
    [ProcessingMethod.WEBGPU]: { time: 0, success: false },
    [ProcessingMethod.WEBGL]: { time: 0, success: false },
    [ProcessingMethod.ORIGINAL]: { time: 0, success: false },
  };

  const capabilities = await processor.detectCapabilities();

  // Test each available method
  for (const method of Object.values(ProcessingMethod)) {
    if (method === ProcessingMethod.WEBGPU && !capabilities.webgpu) continue;
    if (method === ProcessingMethod.WEBGL && !capabilities.webgl) continue;

    try {
      const startTime = performance.now();
      await processor.processImage(file, maskCanvasCtx, undefined, method);
      const endTime = performance.now();

      results[method] = {
        time: endTime - startTime,
        success: true,
      };
    } catch (error) {
      results[method] = {
        time: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return results;
};

/**
 * Create a File object from the processed blob with appropriate naming
 */
export const mergeBlobToFileOptimized = (file: File, blob: Blob, method: ProcessingMethod): File => {
  const fileNameAndExtension = getFileNameAndExtension(file.name);

  let maskFileName = fileNameAndExtension?.name ?? nanoIdUpperCase(6);
  const maskFileExtension = fileNameAndExtension?.extension ?? 'png';

  const methodSuffix = method === ProcessingMethod.ORIGINAL ? '' : `-${method}`;
  maskFileName = `${maskFileName}_mask-edited${methodSuffix}_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${maskFileExtension}`;

  const maskFile = new File([blob], maskFileName, { type: 'image/png' }) as FileWithPath;
  set(maskFile, 'path', maskFileName);
  return maskFile;
};

/**
 * Cleanup all GPU resources
 */
export const cleanupOptimized = () => {
  if (optimizedProcessor) {
    optimizedProcessor.cleanup();
    optimizedProcessor = null;
  }
};

// Export types
export type { ProcessingCapabilities };
