/**
 * Example usage of the optimized mask processing functions
 *
 * This file demonstrates how to use the WebGPU, WebGL, and unified optimized
 * implementations of the mask application function.
 */

import {
  applyMaskCanvasToOriginalImageFileOptimized,
  benchmarkProcessingMethods,
  cleanupOptimized,
  getProcessingCapabilities,
  mergeBlobToFileOptimized,
  ProcessingMethod,
} from './utils-optimized';
import { applyMaskCanvasToOriginalImageFileWebGL } from './utils-webgl';
import { applyMaskCanvasToOriginalImageFileWebGPU } from './utils-webgpu';

/**
 * Example 1: Basic usage with automatic optimization
 */
export async function basicOptimizedUsage(
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<File> {
  try {
    // This will automatically choose the best available method
    const resultBlob = await applyMaskCanvasToOriginalImageFileOptimized(file, maskCanvasCtx, onProgress);

    // Create a file with optimized naming
    return mergeBlobToFileOptimized(file, resultBlob, ProcessingMethod.WEBGPU);
  } catch (error) {
    console.error('Optimized processing failed:', error);
    throw error;
  }
}

/**
 * Example 2: Force a specific processing method
 */
export async function forceSpecificMethod(
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  method: ProcessingMethod,
  onProgress?: (progress: number) => void,
): Promise<File> {
  try {
    const resultBlob = await applyMaskCanvasToOriginalImageFileOptimized(
      file,
      maskCanvasCtx,
      onProgress,
      method, // Force specific method
    );

    return mergeBlobToFileOptimized(file, resultBlob, method);
  } catch (error) {
    console.error(`Processing with ${method} failed:`, error);
    throw error;
  }
}

/**
 * Example 3: Check browser capabilities before processing
 */
export async function checkCapabilitiesExample(): Promise<void> {
  const capabilities = await getProcessingCapabilities();

  console.log('Browser capabilities:');
  console.log(`WebGPU supported: ${capabilities.webgpu}`);
  console.log(`WebGL supported: ${capabilities.webgl}`);
  console.log(`Optimal method: ${capabilities.optimal}`);

  if (capabilities.webgpu) {
    console.log('🚀 WebGPU available - expect fastest performance!');
  } else if (capabilities.webgl) {
    console.log('⚡ WebGL available - good performance expected');
  } else {
    console.log('⚠️ Only CPU processing available - slower performance');
  }
}

/**
 * Example 4: Benchmark different methods for performance comparison
 */
export async function performanceBenchmark(file: File, maskCanvasCtx: CanvasRenderingContext2D): Promise<void> {
  console.log('Starting performance benchmark...');

  try {
    const results = await benchmarkProcessingMethods(file, maskCanvasCtx);

    console.log('Benchmark Results:');
    console.log('==================');

    Object.entries(results).forEach(([method, result]) => {
      if (result.success) {
        console.log(`${method.toUpperCase()}: ${result.time.toFixed(2)}ms ✅`);
      } else {
        console.log(`${method.toUpperCase()}: Failed - ${result.error} ❌`);
      }
    });

    // Find fastest successful method
    const successfulResults = Object.entries(results)
      .filter(([, result]) => result.success)
      .sort(([, a], [, b]) => a.time - b.time);

    if (successfulResults.length > 0) {
      const [fastestMethod, fastestResult] = successfulResults[0];
      console.log(`\n🏆 Fastest method: ${fastestMethod.toUpperCase()} (${fastestResult.time.toFixed(2)}ms)`);
    }
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
}

/**
 * Example 5: Direct WebGPU usage (advanced)
 */
export async function directWebGPUUsage(
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<File> {
  try {
    console.log('Using WebGPU directly...');
    const resultBlob = await applyMaskCanvasToOriginalImageFileWebGPU(file, maskCanvasCtx, onProgress);

    return mergeBlobToFileOptimized(file, resultBlob, ProcessingMethod.WEBGPU);
  } catch (error) {
    console.error('Direct WebGPU usage failed:', error);
    throw error;
  }
}

/**
 * Example 6: Direct WebGL usage (advanced)
 */
export async function directWebGLUsage(
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<File> {
  try {
    console.log('Using WebGL directly...');
    const resultBlob = await applyMaskCanvasToOriginalImageFileWebGL(file, maskCanvasCtx, onProgress);

    return mergeBlobToFileOptimized(file, resultBlob, ProcessingMethod.WEBGL);
  } catch (error) {
    console.error('Direct WebGL usage failed:', error);
    throw error;
  }
}

/**
 * Example 7: Complete workflow with error handling and cleanup
 */
export async function completeWorkflowExample(file: File, maskCanvasCtx: CanvasRenderingContext2D): Promise<File> {
  try {
    // 1. Check capabilities
    const capabilities = await getProcessingCapabilities();
    console.log(`Using optimal method: ${capabilities.optimal}`);

    // 2. Process with progress tracking
    let lastProgress = 0;
    const resultBlob = await applyMaskCanvasToOriginalImageFileOptimized(file, maskCanvasCtx, (progress) => {
      if (progress - lastProgress >= 10) {
        // Log every 10%
        console.log(`Processing: ${progress}%`);
        lastProgress = progress;
      }
    });

    // 3. Create final file
    const resultFile = mergeBlobToFileOptimized(file, resultBlob, capabilities.optimal);

    console.log(`✅ Processing complete! File: ${resultFile.name}`);
    return resultFile;
  } catch (error) {
    console.error('❌ Processing failed:', error);
    throw error;
  } finally {
    // 4. Always cleanup GPU resources
    cleanupOptimized();
    console.log('🧹 GPU resources cleaned up');
  }
}

/**
 * Example 8: Batch processing multiple files
 */
export async function batchProcessingExample(
  files: File[],
  maskCanvasCtx: CanvasRenderingContext2D,
  onFileComplete?: (index: number, total: number, file: File) => void,
): Promise<File[]> {
  const results: File[] = [];

  try {
    // Check capabilities once
    const capabilities = await getProcessingCapabilities();
    console.log(`Batch processing ${files.length} files using: ${capabilities.optimal}`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);

      try {
        const resultBlob = await applyMaskCanvasToOriginalImageFileOptimized(file, maskCanvasCtx, (progress) => {
          // Optional: report progress for each file
          console.log(`File ${i + 1} progress: ${progress}%`);
        });

        const resultFile = mergeBlobToFileOptimized(file, resultBlob, capabilities.optimal);
        results.push(resultFile);

        onFileComplete?.(i, files.length, resultFile);
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        // Continue with next file instead of failing entire batch
      }
    }

    console.log(`✅ Batch processing complete! ${results.length}/${files.length} files processed successfully`);
    return results;
  } finally {
    // Cleanup after batch processing
    cleanupOptimized();
  }
}

// Export all examples for easy importing
export const examples = {
  basicOptimizedUsage,
  forceSpecificMethod,
  checkCapabilitiesExample,
  performanceBenchmark,
  directWebGPUUsage,
  directWebGLUsage,
  completeWorkflowExample,
  batchProcessingExample,
};
