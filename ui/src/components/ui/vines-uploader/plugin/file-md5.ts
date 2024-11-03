import { BasePlugin, Uppy, UppyFile } from '@uppy/core';
import type { DefinePluginOpts, PluginOpts } from '@uppy/core/lib/BasePlugin.js';
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue';
import type { Body, Meta } from '@uppy/utils/lib/UppyFile';
import SparkMD5 from 'spark-md5';

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'file-md5:complete': (file: UppyFile<M, B>[]) => void;
  }
}

export interface FileMd5Opts extends PluginOpts {
  limit?: number;
  chunk?: number;
  removeDuplicate?: boolean;
}

const defaultOptions = {
  chunk: 2097152,
  removeDuplicate: true,
} satisfies Partial<FileMd5Opts>;

export default class FileMd5<M extends Meta, B extends Body> extends BasePlugin<
  DefinePluginOpts<FileMd5Opts, keyof typeof defaultOptions>,
  M,
  B
> {
  #RateLimitedQueue: RateLimitedQueue;
  private blobSlice: (start?: number, end?: number, contentType?: string) => Blob;

  constructor(uppy: Uppy<M, B>, opts?: FileMd5Opts) {
    super(uppy, { ...defaultOptions, ...opts });
    this.id = this.opts.id || 'FileMd5';
    this.type = 'modifier';

    this.#RateLimitedQueue = new RateLimitedQueue(this.opts.limit);

    this.blobSlice =
      File.prototype.slice ||
      // @ts-ignore
      File.prototype?.mozSlice ||
      // @ts-ignore
      File.prototype?.webkitSlice;

    this.prepareUpload = this.prepareUpload.bind(this);
  }

  async calculateMD5(file: UppyFile<M, B>): Promise<string> {
    this.uppy.log(`[FileMd5] Calculating MD5: ${file.name}`);

    const { chunk } = this.opts;
    const { data: fileData, size: fileSize } = file;

    if (!fileData || !fileSize) {
      throw new Error('File data or size is undefined');
    }

    const chunks = Math.ceil(fileSize / chunk);
    const spark = new SparkMD5.ArrayBuffer();

    for (let i = 0; i < chunks; i++) {
      const start = i * chunk;
      const end = Math.min(start + chunk, fileSize);
      const blob = this.blobSlice.call(fileData, start, end);

      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e?.target?.result;
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Failed to read file chunk'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });

      spark.append(buffer);
      this.uppy.setFileState(file.id, {
        meta: {
          ...file.meta,
          md5Progress: ((i + 1) / chunks) * 100,
        },
      });
    }

    return spark.end();
  }

  async prepareUpload(fileIDs: string[]): Promise<void> {
    const calculatedFiles: UppyFile<M, B>[] = [];
    const calculateAndApplyResult = this.#RateLimitedQueue.wrapPromiseFunction(async (file: UppyFile<M, B>) => {
      try {
        this.uppy.setFileState(file.id, {
          meta: {
            ...file.meta,
            md5: await this.calculateMD5(file),
          },
        });
        calculatedFiles.push(file);
      } catch (err) {
        this.uppy.log(`[FileMd5] Failed to calculate ${file.id} MD5:`, 'warning');
        this.uppy.log(err as any, 'warning');
      }
    });

    await Promise.all(
      fileIDs.map((fileID) => {
        const file = this.uppy.getFile(fileID);
        this.uppy.emit('preprocess-progress', file, {
          mode: 'indeterminate',
          message: 'Calculating MD5...',
        });

        if (file.isRemote) {
          return Promise.resolve();
        }

        if (!file.data.type) {
          file.data = file.data.slice(0, file.data.size, file.type);
        }

        return calculateAndApplyResult(file);
      }),
    );

    this.uppy.emit('file-md5:complete', calculatedFiles);

    for (const fileID of fileIDs) {
      const file = this.uppy.getFile(fileID);
      this.uppy.emit('preprocess-complete', file);
    }

    // Remove duplicate files
    if (this.opts.removeDuplicate) {
      const md5Map = new Map<string, UppyFile<M, B>>();
      for (const file of this.uppy.getFiles()) {
        const { md5 } = file.meta as unknown as { md5: string };
        if (md5 && !md5Map.has(md5)) {
          md5Map.set(md5, file);
        } else {
          this.uppy.removeFile(file.id);
        }
      }
    }
  }

  install() {
    this.uppy.addPreProcessor(this.prepareUpload);
  }

  uninstall() {
    this.uppy.removePreProcessor(this.prepareUpload);
  }
}
