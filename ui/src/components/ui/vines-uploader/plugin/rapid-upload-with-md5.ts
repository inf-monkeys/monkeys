import { BasePlugin, Uppy, UppyFile } from '@uppy/core';
import type { DefinePluginOpts, PluginOpts } from '@uppy/core/lib/BasePlugin.js';
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue';
import type { Body, Meta } from '@uppy/utils/lib/UppyFile';

import { getResourceByMd5 } from '@/apis/resources';

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'rapid-upload:complete': (file: UppyFile<M, B>[]) => void;
  }
}

export interface RapidUploadOpts extends PluginOpts {
  limit?: number;
}

const defaultOptions = {} satisfies Partial<RapidUploadOpts>;

export default class RapidUpload<M extends Meta, B extends Body> extends BasePlugin<
  DefinePluginOpts<RapidUploadOpts, keyof typeof defaultOptions>,
  M,
  B
> {
  #RateLimitedQueue: RateLimitedQueue;

  constructor(uppy: Uppy<M, B>, opts?: RapidUploadOpts) {
    super(uppy, { ...defaultOptions, ...opts });
    this.id = this.opts.id || 'RapidUpload';
    this.type = 'modifier';

    this.#RateLimitedQueue = new RateLimitedQueue(this.opts.limit);

    this.prepareUpload = this.prepareUpload.bind(this);
  }

  async getRemoteUrlWithMd5(md5: string): Promise<string | null> {
    return (await getResourceByMd5(md5))?.data?.url || null;
  }

  async prepareUpload(fileIDs: string[]): Promise<void> {
    const calculatedFiles: UppyFile<M, B>[] = [];
    const calculateAndApplyResult = this.#RateLimitedQueue.wrapPromiseFunction(async (file: UppyFile<M, B>) => {
      try {
        const remoteUrl = await this.getRemoteUrlWithMd5(file.meta.md5 as string);

        if (remoteUrl) {
          this.uppy.log(`[RapidUpload] Found remote file for ${file.id}: ${remoteUrl}`, 'debug');
          this.uppy.setFileState(file.id, {
            ...file,
            isRemote: true,
            uploadURL: remoteUrl,
            meta: {
              ...file.meta,
              remoteUrl,
              isRapidUploaded: true,
            },
            progress: { ...file.progress, uploadComplete: true, percentage: 100 },
          });
        }

        calculatedFiles.push(file);
      } catch (err) {
        this.uppy.log(`[RapidUpload] Failed to rapid upload ${file.id}:`, 'warning');
        this.uppy.log(err as any, 'warning');
      }
    });

    await Promise.all(
      fileIDs.map((fileID) => {
        const file = this.uppy.getFile(fileID);
        this.uppy.emit('preprocess-progress', file, {
          mode: 'indeterminate',
          message: 'Rapid uploading...',
        });

        if (file.isRemote) {
          return Promise.resolve();
        }

        if (!file.data.type) {
          file.data = file.data.slice(0, file.data.size, file.type);
        }

        if (!file.meta.md5) {
          this.uppy.log(`[RapidUpload] ${file.id} has no md5, skipping...`, 'warning');
          return Promise.resolve();
        }

        return calculateAndApplyResult(file);
      }),
    );

    this.uppy.emit('rapid-upload:complete', calculatedFiles);

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
