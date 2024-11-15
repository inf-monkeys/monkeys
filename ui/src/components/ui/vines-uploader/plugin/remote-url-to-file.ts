import { BasePlugin, Uppy, UppyFile } from '@uppy/core';
import type { DefinePluginOpts, PluginOpts } from '@uppy/core/lib/BasePlugin.js';
import ThumbnailGenerator from '@uppy/thumbnail-generator/src';
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue';
import type { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { fileTypeFromBlob } from 'file-type';
import { set } from 'lodash';

import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils.ts';
import FileMd5 from '@/components/ui/vines-uploader/plugin/file-md5.ts';
import RapidUpload from '@/components/ui/vines-uploader/plugin/rapid-upload-with-md5.ts';

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'remote-url-to-file:complete': (file: UppyFile<M, B>[]) => void;
  }
}

export interface RemoteUrlToFileOpts extends PluginOpts {
  limit?: number;
  removeFileWhenGettingFails?: boolean;
}

const defaultOptions = {
  removeFileWhenGettingFails: true,
} satisfies Partial<RemoteUrlToFileOpts>;

export default class RemoteUrlToFile<M extends Meta, B extends Body> extends BasePlugin<
  DefinePluginOpts<RemoteUrlToFileOpts, keyof typeof defaultOptions>,
  M,
  B
> {
  #RateLimitedQueue: RateLimitedQueue;

  constructor(uppy: Uppy<M, B>, opts?: RemoteUrlToFileOpts) {
    super(uppy, { ...defaultOptions, ...opts });
    this.id = this.opts.id || 'RemoteUrlToFile';
    this.type = 'modifier';

    this.#RateLimitedQueue = new RateLimitedQueue(this.opts.limit);

    this.prepareUpload = this.prepareUpload.bind(this);
  }

  async requestGetRemoteFile(remoteUrl?: string): Promise<Blob> {
    if (!remoteUrl) {
      return Promise.reject(new Error('remoteUrl is not defined'));
    }

    return fetch(remoteUrl).then((response) => response.blob());
  }

  async prepareUpload(fileIDs: string[]): Promise<void> {
    const processedFiles: UppyFile<M, B>[] = [];
    const calculateAndApplyResult = this.#RateLimitedQueue.wrapPromiseFunction(async (file: UppyFile<M, B>) => {
      try {
        const remoteUrl = file.meta.remoteUrl as string;
        this.uppy.log(`[RemoteUrlToFile] Converting remote url to file ${file.id}: ${remoteUrl}`, 'debug');

        let blob: Blob | undefined;
        try {
          // 构造缩略图地址
          const srcPath = remoteUrl.split('/');
          const srcPathLength = srcPath.length;
          const thumbUrl = srcPath.map((it, i) => (i === srcPathLength - 2 ? `${it}_thumb` : it)).join('/');

          // 检查 OSS 缩略图可用性
          const isThumbAvailable = await checkImageUrlAvailable(thumbUrl);

          blob = await this.requestGetRemoteFile(isThumbAvailable ? thumbUrl : remoteUrl);
        } catch {
          if (this.opts.removeFileWhenGettingFails) {
            this.uppy.log(`[RemoteUrlToFile] Removing file ${file.id} due to fetch failure`, 'warning');
            this.uppy.removeFile(file.id);
          } else {
            this.uppy.log(`[RemoteUrlToFile] Failed to fetch remote url ${remoteUrl}`, 'warning');
          }
          return;
        }

        if (!blob) {
          this.uppy.log(`[RemoteUrlToFile] Failed to fetch remote url ${remoteUrl}`, 'warning');
          return;
        }

        const fileType = await fileTypeFromBlob(blob);

        const remoteFile: UppyFile<M, B> = {
          ...file,
          size: blob.size,
          type: fileType?.mime || blob.type,
          data: blob,
        };

        // 生成缩略图
        await (this.uppy.getPlugin('ThumbnailGenerator') as ThumbnailGenerator<M, B>)?.requestThumbnail(remoteFile);

        // 计算 md5
        const md5 = await (this.uppy.getPlugin('FileMd5') as FileMd5<M, B>)?.calculateMD5(remoteFile);

        const latestFile = this.uppy.getFile(file.id);

        // 检测是否已经上传
        const serverRemoteUrl = await (this.uppy.getPlugin('RapidUpload') as RapidUpload<M, B>)?.getRemoteUrlWithMd5(
          md5,
        );

        if (serverRemoteUrl) {
          this.uppy.log(`[RemoteUrlToFile] Found remote file for ${file.id}: ${serverRemoteUrl}`, 'debug');
          set(latestFile, 'meta.remoteUrl', serverRemoteUrl);
          set(latestFile, 'uploadURL', serverRemoteUrl);
        }

        this.uppy.setFileState(file.id, {
          ...latestFile,
          data: blob,
          meta: {
            ...remoteFile.meta,
            md5,
          },
          isRemote: true,
          progress: { ...file.progress, uploadComplete: !!serverRemoteUrl },
        });

        processedFiles.push(file);
      } catch (err) {
        this.uppy.log(`[RemoteUrlToFile] Failed to convert remote url to file ${file.id}:`, 'warning');
        this.uppy.log(err as any, 'warning');
      }
    });

    await Promise.all(
      fileIDs.map((fileID) => {
        const file = this.uppy.getFile(fileID);
        this.uppy.emit('preprocess-progress', file, {
          mode: 'indeterminate',
          message: 'Converting remote url to file...',
        });

        if (file.isRemote) {
          return Promise.resolve();
        }

        if (!file.meta.remoteUrl) {
          this.uppy.log(`[RemoteUrlToFile] ${file.id} has no remoteUrl, skipping...`, 'warning');
          return Promise.resolve();
        }

        if (!file.data.type) {
          file.data = file.data.slice(0, file.data.size, file.type);
        }

        return calculateAndApplyResult(file);
      }),
    );

    this.uppy.emit('remote-url-to-file:complete', processedFiles);

    for (const fileID of fileIDs) {
      const file = this.uppy.getFile(fileID);
      this.uppy.emit('preprocess-complete', file);
    }
  }

  install() {
    this.uppy.addPreProcessor(this.prepareUpload);
  }

  uninstall() {
    this.uppy.removePreProcessor(this.prepareUpload);
  }
}
