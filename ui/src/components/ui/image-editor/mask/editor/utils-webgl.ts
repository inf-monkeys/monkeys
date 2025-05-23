import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';

import { nanoIdUpperCase } from '@/utils';

// WebGL fragment shader for applying mask to image
const WEBGL_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

const WEBGL_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_originalImage;
uniform sampler2D u_maskImage;
varying vec2 v_texCoord;

void main() {
    vec4 originalPixel = texture2D(u_originalImage, v_texCoord);
    vec4 maskPixel = texture2D(u_maskImage, v_texCoord);
    
    // If mask alpha > 0, set original alpha to 0, otherwise keep original
    float resultAlpha = maskPixel.a > 0.0 ? 0.0 : originalPixel.a;
    
    gl_FragColor = vec4(originalPixel.rgb, resultAlpha);
}
`;

class WebGLMaskProcessor {
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private initialized = false;
  private canvas: HTMLCanvasElement | null = null;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Create offscreen canvas
      this.canvas = document.createElement('canvas');

      // Try WebGL2 first, fallback to WebGL1
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');

      if (!this.gl) {
        console.warn('WebGL not supported');
        return false;
      }

      // Create shader program
      const vertexShader = this.createShader(this.gl.VERTEX_SHADER, WEBGL_VERTEX_SHADER);
      const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, WEBGL_FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) {
        console.warn('Failed to create WebGL shaders');
        return false;
      }

      this.program = this.createProgram(vertexShader, fragmentShader);
      if (!this.program) {
        console.warn('Failed to create WebGL program');
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize WebGL:', error);
      return false;
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    if (!this.gl) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  private createTexture(imageData: ImageData): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    // Upload image data
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      imageData.width,
      imageData.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      imageData.data,
    );

    return texture;
  }

  async processImage(
    originalImageData: ImageData,
    maskImageData: ImageData,
    onProgress?: (progress: number) => void,
  ): Promise<ImageData> {
    if (!this.gl || !this.program || !this.canvas) {
      throw new Error('WebGL not initialized');
    }

    const { width, height } = originalImageData;

    onProgress?.(10);

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    onProgress?.(20);

    // Create textures
    const originalTexture = this.createTexture(originalImageData);
    const maskTexture = this.createTexture(maskImageData);

    if (!originalTexture || !maskTexture) {
      throw new Error('Failed to create WebGL textures');
    }

    onProgress?.(30);

    // Use shader program
    this.gl.useProgram(this.program);

    // Set up vertex buffer for full-screen quad
    const positions = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    onProgress?.(40);

    // Set up attributes
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);

    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);

    onProgress?.(50);

    // Set up uniforms
    const originalImageLocation = this.gl.getUniformLocation(this.program, 'u_originalImage');
    const maskImageLocation = this.gl.getUniformLocation(this.program, 'u_maskImage');

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, originalTexture);
    this.gl.uniform1i(originalImageLocation, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, maskTexture);
    this.gl.uniform1i(maskImageLocation, 1);

    onProgress?.(60);

    // Render
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    onProgress?.(80);

    // Read pixels back
    const resultPixels = new Uint8Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, resultPixels);

    onProgress?.(90);

    // Create result ImageData
    const resultImageData = new ImageData(new Uint8ClampedArray(resultPixels), width, height);

    // Cleanup
    this.gl.deleteTexture(originalTexture);
    this.gl.deleteTexture(maskTexture);
    this.gl.deleteBuffer(positionBuffer);

    onProgress?.(100);

    return resultImageData;
  }

  destroy() {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
    this.canvas = null;
    this.initialized = false;
  }
}

// Singleton instance
let webglProcessor: WebGLMaskProcessor | null = null;

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

export const applyMaskCanvasToOriginalImageFileWebGL = async (
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  // Initialize WebGL processor if needed
  if (!webglProcessor) {
    webglProcessor = new WebGLMaskProcessor();
  }

  const initialized = await webglProcessor.initialize();
  if (!initialized) {
    throw new Error('WebGL initialization failed. Please ensure your browser supports WebGL.');
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

  // Process with WebGL
  const resultImageData = await webglProcessor.processImage(
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

  maskFileName = `${maskFileName}_mask-edited-webgl_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${maskFileExtension}`;

  const maskFile = new File([blob], maskFileName, { type: 'image/png' }) as FileWithPath;
  set(maskFile, 'path', maskFileName);
  return maskFile;
};

// Cleanup function to be called when component unmounts
export const cleanupWebGL = () => {
  if (webglProcessor) {
    webglProcessor.destroy();
    webglProcessor = null;
  }
};
