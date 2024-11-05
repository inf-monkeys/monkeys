import { Uppy, UppyFile } from '@uppy/core';
import BasePlugin, { DefinePluginOpts, PluginOpts } from '@uppy/core/lib/BasePlugin';
import EventManager from '@uppy/core/lib/EventManager.js';
import { filterFilesToEmitUploadStarted, filterNonFailedFiles } from '@uppy/utils/lib/fileFilters';
import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import isNetworkError from '@uppy/utils/lib/isNetworkError';
import isPreviewSupported from '@uppy/utils/lib/isPreviewSupported';
import NetworkError from '@uppy/utils/lib/NetworkError';
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue';
import type { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { set } from 'lodash';

import { createMediaFile } from '@/apis/resources';
import { VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { cloneDeep } from '@/utils';

import { generateSSOFilePrefixId } from '../utils';

export interface VinesUploadOpts<M extends Meta, B extends Body> extends PluginOpts {
  headers?: Record<string, string> | ((file: UppyFile<M, B>) => Record<string, string>);

  basePath?: string;

  limit?: number;
}

export type { VinesUploadOpts as VinesUploadOptions };

declare module '@uppy/utils/lib/UppyFile' {
  export interface UppyFile<M extends Meta, B extends Body> {
    vinesUpload?: VinesUploadOpts<M, B>;
  }
}

declare module '@uppy/core' {
  export interface State<M extends Meta, B extends Body> {
    vinesUpload?: VinesUploadOpts<M, B>;
  }
}

const defaultOptions = {
  limit: 2,
  basePath: 'user-files/other',
} satisfies Partial<VinesUploadOpts<any, any>>;

type Opts<M extends Meta, B extends Body> = DefinePluginOpts<VinesUploadOpts<M, B>, keyof typeof defaultOptions>;

interface S3Config {
  baseUrl: string;
  isPrivate: boolean;
  proxy: boolean;
}

interface PartUploadResponse {
  PartNumber: number;
  ETag: string;
}

export default class VinesUpload<M extends Meta, B extends Body> extends BasePlugin<Opts<M, B>, M, B> {
  requests: RateLimitedQueue;

  private baseUrl: string = '';
  private isPrivate: boolean = false;
  private proxy: boolean = false;

  private xhr: XMLHttpRequest | null = null;

  constructor(uppy: Uppy<M, B>, opts: VinesUploadOpts<M, B>) {
    super(uppy, { ...defaultOptions, ...opts });
    this.type = 'uploader';
    this.id = this.opts.id || 'VinesUpload';

    this.requests = new RateLimitedQueue(this.opts.limit);
  }

  private buildResponseError(xhr: XMLHttpRequest, err?: string | Error | NetworkError) {
    let error = err;
    // No error message
    if (!error) error = new Error('Upload error');
    // Got an error message string
    if (typeof error === 'string') error = new Error(error);
    // Got something else
    if (!(error instanceof Error)) {
      error = Object.assign(new Error('Upload error'), { data: error });
    }

    if (isNetworkError(xhr)) {
      error = new NetworkError(error, xhr);
      return error;
    }

    // @ts-expect-error request can only be set on NetworkError
    // but we use NetworkError to distinguish between errors.
    error.request = xhr;
    return error;
  }

  private createXHR(method: string, url: string, headers: Record<string, string> = {}): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    return xhr;
  }

  private async fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, options);
    const data = await response.json();
    return data?.data as T;
  }

  private setupXHREvents(
    xhr: XMLHttpRequest,
    file: UppyFile<M, B>,
    controller: AbortController,
    onSuccess: () => void,
    onError: (error: Error) => void,
  ) {
    this.xhr = xhr;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        this.uppy.emit('upload-progress', file, {
          uploadStarted: file.progress.uploadStarted ?? 0,
          bytesUploaded: (e.loaded / e.total) * file.size!,
          bytesTotal: file.size,
        });
      }
    });

    xhr.onload = () => {
      if ([200, 201].includes(xhr.status)) {
        onSuccess();
      } else {
        onError(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => onError(new Error('Upload failed'));

    controller.signal.addEventListener('abort', () => {
      xhr.abort();
      onError(new Error('Upload aborted'));
    });
  }

  private async updateFileSuccessState(file: UppyFile<M, B>, uploadURL: string) {
    this.uppy.emit('upload-success', file, {
      status: 200,
      body: { url: uploadURL } as unknown as B,
      uploadURL,
    });

    const currentFile = this.uppy.getFile(file.id);
    this.uppy.setFileState(file.id, {
      ...currentFile,
      progress: { ...currentFile.progress, uploadComplete: true },
      meta: { ...currentFile.meta, remoteUrl: uploadURL, isUploading: false },
      isRemote: true,
    });

    await createMediaFile({
      type: file.type as VinesResourceType,
      md5: file.meta.md5 as string,
      displayName: file.name!,
      source: VinesResourceSource.UPLOAD,
      url: uploadURL,
      tags: [],
      categoryIds: [],
      size: file.size!,
    });
  }

  private async handleUploadWithEvents(file: UppyFile<M, B>, uploadFn: () => Promise<string>) {
    const events = new EventManager(this.uppy);
    const controller = new AbortController();

    events.onFileRemove(file.id, () => controller.abort());
    events.onCancelAll(file.id, () => controller.abort());

    const isNotThumbnail = !file.meta.isThumbnail;

    try {
      const uploadURL = await this.requests.wrapPromiseFunction(uploadFn)().abortOn(controller.signal);
      if (isNotThumbnail) {
        await this.updateFileSuccessState(file, uploadURL);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Cancelled') {
        this.uppy.log(`[VinesUpload] Upload ${file.name} failed`, error.message);

        if (isNotThumbnail) {
          const currentFile = this.uppy.getFile(file.id);
          this.uppy.setFileState(file.id, {
            ...currentFile,
            meta: { ...currentFile.meta, isUploading: false },
          });
          if (this.xhr) {
            this.uppy.emit('upload-error', currentFile, this.buildResponseError(this.xhr, error), this.xhr);
          } else {
            this.uppy.emit('upload-error', currentFile, Object.assign(new Error('Upload error'), { data: error }));
          }
        }

        throw error;
      }
    } finally {
      events.remove();
    }
  }

  async uploadFileUseProxy(file: UppyFile<M, B>) {
    this.uppy.log('[VinesUpload] Uploading..., Use Proxy', file.name);

    await this.handleUploadWithEvents(file, async () => {
      const { filename } = await this.#prepareUpload(file);

      return new Promise<string>((resolve, reject) => {
        const xhr = this.createXHR('POST', '/api/medias/s3/file');
        const formData = new FormData();
        formData.append('key', filename);
        formData.append('file', file.data as File);

        this.setupXHREvents(
          xhr,
          file,
          new AbortController(),
          () => {
            const response = JSON.parse(xhr.responseText);
            resolve(response?.data ?? this.baseUrl + filename);
          },
          reject,
        );

        xhr.send(formData);
      });
    });
  }

  async uploadFileUsePresign(file: UppyFile<M, B>) {
    this.uppy.log('[VinesUpload] Uploading..., Use Presign', file.name);

    await this.handleUploadWithEvents(file, async () => {
      const { filename } = await this.#prepareUpload(file);
      const presignedUrl = await this.fetchJSON<string>(`/api/medias/s3/presign?key=${filename}`);

      await new Promise<void>((resolve, reject) => {
        const xhr = this.createXHR('PUT', presignedUrl);
        this.setupXHREvents(xhr, file, new AbortController(), resolve, reject);
        xhr.send(file.data);
      });

      return this.isPrivate
        ? await this.fetchJSON<string>(`/api/medias/s3/sign?key=${filename}`)
        : this.baseUrl + filename;
    });
  }

  async uploadFileUseMultipart(file: UppyFile<M, B>) {
    this.uppy.log('[VinesUpload] Uploading..., Use Multipart', file.name);

    await this.handleUploadWithEvents(file, async () => {
      const { filename } = await this.#prepareUpload(file);
      const { UploadId } = await this.fetchJSON<{ UploadId: string }>('/api/medias/s3/multipart/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: filename,
          contentType: file.meta.type || 'application/octet-stream',
        }),
      });

      const chunkSize = 1024 * 1024 * 16;
      const chunks = Math.ceil(file.size! / chunkSize);
      const progressArray = new Array(chunks).fill(0);
      let uploadedSize = 0;

      const uploadPart = async (partNumber: number, start: number, end: number): Promise<PartUploadResponse> => {
        const signedUrl = await this.fetchJSON<string>('/api/medias/s3/multipart/part', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: filename, uploadId: UploadId, partNumber }),
        });

        return new Promise((resolve, reject) => {
          const xhr = this.createXHR('PUT', signedUrl);
          const part = file.data.slice(start, end);

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              uploadedSize += e.loaded - progressArray[partNumber - 1];
              progressArray[partNumber - 1] = e.loaded;
              this.uppy.emit('upload-progress', file, {
                uploadStarted: file.progress.uploadStarted ?? 0,
                bytesUploaded: uploadedSize,
                bytesTotal: file.size,
              });
            }
          });

          this.setupXHREvents(
            xhr,
            file,
            new AbortController(),
            () => {
              const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
              if (etag) {
                resolve({ PartNumber: partNumber, ETag: etag });
              } else {
                reject(new Error('Missing ETag in response'));
              }
            },
            reject,
          );

          xhr.send(part);
        });
      };

      const parts = await Promise.all(
        Array.from({ length: chunks }, (_, i) => {
          const partNumber = i + 1;
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size!);
          return uploadPart(partNumber, start, end);
        }),
      );

      await this.fetchJSON('/api/medias/s3/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: filename, uploadId: UploadId, parts }),
      });

      return this.baseUrl + filename;
    });
  }

  async #prepareUpload(file: UppyFile<M, B>) {
    if (!file.meta.isThumbnail) {
      const targetFile = this.uppy.getFile(file.id);
      this.uppy.setFileState(file.id, {
        ...targetFile,
        meta: { ...targetFile.meta, isUploading: true },
      });
    }

    const filename = file.meta.uploadFilename as string;
    if (!filename) {
      throw new Error('Missing upload filename');
    }

    return { filename };
  }

  async #uploadFile(file: UppyFile<M, B>) {
    if (this.proxy) {
      return this.uploadFileUseProxy(file);
    }

    return this.uploadFileUsePresign(file);

    // 暂不支持分片上传
    // if (file.size! < 1024 * 1024 * 1024) {
    //   // 1GB
    //   return this.uploadFileUsePresign(file);
    // }

    // return this.uploadFileUseMultipart(file);
  }

  #handleUpload = async (fileIDs: string[]) => {
    if (fileIDs.length === 0) {
      this.uppy.log('[VinesUpload] No files to upload!');
      return;
    }

    const config = await this.fetchJSON<S3Config>('/api/medias/s3/configs');
    this.baseUrl = config.baseUrl;
    this.isPrivate = config.isPrivate;
    this.proxy = config.proxy;

    this.uppy.log('[VinesUpload] Uploading...');
    const files = this.uppy.getFilesByIds(fileIDs);

    const filesFiltered = filterNonFailedFiles(files).filter((it) => !it.progress.uploadComplete || !it.isRemote);
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered);
    this.uppy.emit('upload-start', filesToEmit);

    const waitUploadFiles: UppyFile<M, B>[] = [];

    for (const file of filesFiltered) {
      if (!file.name || !file.size || !file.meta.md5) {
        this.uppy.log(`[VinesUpload] File ${file.id} is missing name, size or md5, can’t upload`, 'warning');
        this.uppy.setFileState(file.id, {
          ...file,
          error: 'Missing name, size or md5',
        });
        continue;
      }

      const { name, extension } = getFileNameAndExtension(file.name);
      const filename = `${generateSSOFilePrefixId()}_${name}${extension ? '.'.concat(extension) : ''}`;

      file.meta.uploadFilename = `${this.opts.basePath}/${filename}`;
      waitUploadFiles.push(file);

      // 取出缩略图上传
      const thumbnail = file.preview;
      if (isPreviewSupported(file.type) && thumbnail) {
        let thumbnailBlob: Blob | null = null;

        if (thumbnail && thumbnail.startsWith('blob:')) {
          try {
            thumbnailBlob = await fetch(thumbnail).then((res) => res.blob());
          } catch (error) {
            console.error(`[VinesUpload] Failed to fetch ${file.name} thumbnail`, error);
          }

          if (thumbnailBlob) {
            const thumbnailFile = cloneDeep(file);
            set(thumbnailFile, 'data', thumbnailBlob);
            set(thumbnailFile, 'meta.uploadFilename', `${this.opts.basePath}_thumb/${filename}`);
            set(thumbnailFile, 'meta.isThumbnail', true);
            waitUploadFiles.push(thumbnailFile);
          }
        }
      }
    }

    await Promise.allSettled(waitUploadFiles.map((file) => this.#uploadFile(file)));
  };

  install(): void {
    this.uppy.addUploader(this.#handleUpload);
  }

  uninstall(): void {
    this.uppy.removeUploader(this.#handleUpload);
  }
}
