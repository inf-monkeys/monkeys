export const checkImageUrlAvailable = (url: string) =>
  url.startsWith('blob:')
    ? Promise.resolve(true)
    : fetch(url, { method: 'HEAD' })
        .then((response) => response.ok)
        .catch(() => false);

// ref: https://github.com/transloadit/uppy/blob/ca0a7864c9e78e23c69450df8dc2bab338a1a288/packages/%40uppy/thumbnail-generator/src/index.ts
import dataURItoBlob from '@/utils/data-url-to-blob.ts';

const defaultThumbnailDimension = 200;

export const getProportionalDimensions = (
  img: HTMLImageElement,
  width: number | null,
  height: number | null,
  deg: number,
): { width: number; height: number } => {
  let aspect = img.width / img.height;
  if (deg === 90 || deg === 270) {
    aspect = img.height / img.width;
  }

  if (width != null) {
    return {
      width,
      height: Math.round(width / aspect),
    };
  }

  if (height != null) {
    return {
      width: Math.round(height * aspect),
      height,
    };
  }

  return {
    width: defaultThumbnailDimension,
    height: Math.round(defaultThumbnailDimension / aspect),
  };
};

export interface Rotation {
  deg: number;
  rad: number;
  scaleX: number;
  scaleY: number;
  dimensionSwapped: boolean;
  css: boolean;
  canvas: boolean;
}

export const rotateImage = (image: HTMLImageElement, translate: Rotation) => {
  let w = image.width;
  let h = image.height;

  if (translate.deg === 90 || translate.deg === 270) {
    w = image.height;
    h = image.width;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const context = canvas.getContext('2d')!;
  context.translate(w / 2, h / 2);
  if (translate.canvas) {
    context.rotate(translate.rad);
    context.scale(translate.scaleX, translate.scaleY);
  }
  context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);

  return canvas;
};

/**
 * Make sure the image doesn’t exceed browser/device canvas limits.
 * For ios with 256 RAM and ie
 */
const protect = (image: HTMLCanvasElement): HTMLCanvasElement => {
  // https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element

  const ratio = image.width / image.height;

  const maxSquare = 5000000; // ios max canvas square
  const maxSize = 4096; // ie max canvas dimensions

  let maxW = Math.floor(Math.sqrt(maxSquare * ratio));
  let maxH = Math.floor(maxSquare / Math.sqrt(maxSquare * ratio));
  if (maxW > maxSize) {
    maxW = maxSize;
    maxH = Math.round(maxW / ratio);
  }
  if (maxH > maxSize) {
    maxH = maxSize;
    maxW = Math.round(ratio * maxH);
  }
  if (image.width > maxW) {
    const canvas = document.createElement('canvas');
    canvas.width = maxW;
    canvas.height = maxH;
    canvas.getContext('2d')!.drawImage(image, 0, 0, maxW, maxH);
    return canvas;
  }

  return image;
};

export const resizeImage = (image: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement => {
  // Resizing in steps refactored to use a solution from
  // https://blog.uploadcare.com/image-resize-in-browsers-is-broken-e38eed08df01

  let img = protect(image);

  let steps = Math.ceil(Math.log2(img.width / targetWidth));
  if (steps < 1) {
    steps = 1;
  }
  let sW = targetWidth * 2 ** (steps - 1);
  let sH = targetHeight * 2 ** (steps - 1);
  const x = 2;

  while (steps--) {
    const canvas = document.createElement('canvas');
    canvas.width = sW;
    canvas.height = sH;
    canvas.getContext('2d')!.drawImage(img, 0, 0, sW, sH);
    img = canvas;

    sW = Math.round(sW / x);
    sH = Math.round(sH / x);
  }

  return img;
};

export const canvasToBlob = async (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | File> => {
  try {
    canvas.getContext('2d')!.getImageData(0, 0, 1, 1);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 18) {
      return Promise.reject(new Error('cannot read image, probably an svg with external resources'));
    }
  }

  if (canvas.toBlob) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
    if (blob === null) {
      throw new Error('cannot read image, probably an svg with external resources');
    }
    return blob;
  }
  await Promise.resolve();
  const blob_1 = dataURItoBlob(canvas.toDataURL(type, quality), {});
  if (blob_1 === null) {
    throw new Error('could not extract blob, probably an old browser');
  }
  return blob_1;
};
