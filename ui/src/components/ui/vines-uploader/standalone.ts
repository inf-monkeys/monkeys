import Uppy, { Meta, UploadResult, UppyFile } from '@uppy/core';

import FileMd5 from './plugin/file-md5';
import RapidUpload from './plugin/rapid-upload-with-md5';
import RemoteUrlToFile from './plugin/remote-url-to-file';
import VinesUpload from './plugin/vines-upload';

export interface StandaloneUploadOptions {
  maxSize?: number;
  basePath?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (urls: string[]) => void;
  onError?: (error: Error) => void;
  autoUpload?: boolean;
}

export interface StandaloneUploadResult {
  urls: string[];
  files: UppyFile<Meta, Record<string, never>>[];
}

export const createStandaloneUploader = (options: StandaloneUploadOptions = {}) => {
  const { maxSize = 30, basePath = 'user-files/other', autoUpload = true, onProgress, onComplete, onError } = options;

  const uppy = new Uppy({
    autoProceed: autoUpload,
    restrictions: {
      maxFileSize: maxSize * 1024 ** 2,
    },
  })
    .use(RemoteUrlToFile)
    .use(FileMd5)
    .use(RapidUpload)
    .use(VinesUpload, { basePath });

  uppy.on('upload-progress', (file, progress) => {
    if (onProgress && progress.bytesTotal != null) {
      const percentage = (progress.bytesUploaded / progress.bytesTotal) * 100;
      onProgress(percentage);
    }
  });

  uppy.on('complete', (result: UploadResult<Meta, Record<string, never>>) => {
    if (result.successful) {
      const urls = result.successful.map((file) => (file.uploadURL || file.meta.remoteUrl) as string);
      onComplete?.(urls);
    }
  });

  uppy.on('error', (error) => {
    onError?.(error);
  });

  return uppy;
};

export const uploadFiles = async (
  files: File[],
  options: StandaloneUploadOptions = {},
): Promise<StandaloneUploadResult> => {
  return new Promise((resolve, reject) => {
    const uppy = createStandaloneUploader({
      ...options,
      onComplete: (urls) => {
        options.onComplete?.(urls);
        resolve({
          urls,
          files: uppy.getFiles(),
        });
      },
      onError: (error) => {
        options.onError?.(error);
        reject(error);
      },
    });

    files.forEach((file) => {
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    });
  });
};

export const uploadSingleFile = async (
  file: File,
  options: StandaloneUploadOptions = {},
): Promise<StandaloneUploadResult> => {
  return uploadFiles([file], options);
};
