import { customAlphabet } from 'nanoid';
import SparkMD5 from 'spark-md5';

import { simpleFilePut, simpleGet, simplePost } from '@/apis/non-fetcher.ts';
import { PartUploadResponse } from '@/components/ui/updater/typings.ts';

export const coverFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)}KB`;
  }
  return `${(size / 1024 ** 2).toFixed(2)}MB`;
};

// @ts-ignore
const blobSlice = File.prototype.slice || File.prototype?.mozSlice || File.prototype?.webkitSlice;
const chunkSize = 2097152;
export const calculateMD5 = (file: Blob, callback: (process: number) => void) =>
  new Promise((resolve) => {
    const chunks = Math.ceil(file.size / chunkSize);

    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    const loadFileNext = () => {
      const start = loadedChunks * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;

      reader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };

    let loadedChunks = 0;
    reader.onload = (e) => {
      if (!(e?.target?.result instanceof ArrayBuffer)) return;
      spark.append(e.target.result);
      loadedChunks++;

      callback((loadedChunks / chunks) * 100);

      loadedChunks < chunks ? loadFileNext() : resolve(spark.end());
    };
    reader.onerror = () => {
      resolve('');
      callback(-1);
    };

    loadFileNext();
  });

export const generateUploadFilePrefix = (length = 6) =>
  'R' + customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', length - 1)();

export const escapeFileName = (filename: string) =>
  filename.replace(/[&\\#,+()$~%.'":*?<>{}]/g, (match) => '%' + match.charCodeAt(0).toString(16));

export const uploadFile = async (file: File, filename: string, onProgress: (progress: number) => void) => {
  const filesize = file.size;

  const { baseUrl } = await simpleGet<{ baseUrl: string }>('/api/medias/s3/configs');

  if (filesize < 1 << 30) {
    const url = await simpleGet<string>(`/api/medias/s3/presign?key=${filename}`);
    await simpleFilePut(url, file, onProgress);
    return baseUrl + filename;
  }

  const { UploadId } = await simplePost<{ UploadId: string }, Record<string, string>>(
    '/api/medias/s3/multipart/create',
    {
      key: filename,
      contentType: file.type,
    },
  );
  const chunkSize = 1024 * 1024 * 16;
  const chunks = Math.ceil(filesize / chunkSize);

  const tasks: Promise<PartUploadResponse>[] = [];
  const progressArray: number[] = new Array(chunks).fill(0);

  let uploadedSize = 0;
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
    const part = file.slice(start, end);

    const task = new Promise<PartUploadResponse>((resolve) => {
      simplePost<string, Record<string, string | number>>('/api/medias/s3/multipart/part', {
        key: filename,
        uploadId: UploadId,
        partNumber: i + 1,
      }).then((signedUrl) => {
        simpleFilePut(signedUrl, <File>part, (_, e) => {
          uploadedSize += e.loaded - progressArray[i];
          progressArray[i] = e.loaded;
          onProgress(Math.round((uploadedSize / filesize) * 10000) / 100 - 1);
        }).then((res) => {
          resolve({
            PartNumber: i + 1,
            ETag: res.getResponseHeader('ETag')?.replace(/"/g, '') as string,
          });
        });
      });
    });
    tasks.push(task);
  }
  const parts = await Promise.all(tasks);

  await simplePost<string, Record<string, unknown>>('/api/medias/s3/multipart/complete', {
    key: filename,
    uploadId: UploadId,
    parts,
  });

  onProgress(100);

  return baseUrl + filename;
};

export function getFileNameByOssUrl(url?: string) {
  if (!url) return '未知文件';

  url = decodeURIComponent(url);

  const OSS_FILE_REG = /^https:\/\/static\.infmonkeys\.com\/(?:\S+\/)*(\S+\.\S+)$/;
  const OSS_FILE_WITH_PREFIX_REG = /^https:\/\/static\.infmonkeys\.com\/(?:\S+\/)*(R\S+)_(\S+\.\S+)$/;
  const FILE_REG = /^https?:\/\/\S+\/(?:\S+\/)*(\S+\.\S+)$/;

  const isOssFile = OSS_FILE_REG.test(url);
  const isOssFileWithPrefix = OSS_FILE_WITH_PREFIX_REG.test(url);
  const isFile = FILE_REG.test(url);

  if (!isOssFile && isFile) {
    return FILE_REG.exec(url)![1];
  } else if (isOssFile && !isOssFileWithPrefix) {
    return OSS_FILE_REG.exec(url)![1];
  } else if (isOssFileWithPrefix) {
    return OSS_FILE_WITH_PREFIX_REG.exec(url)![2];
  }
  return '未知文件';
}

export async function getImageSize(url: string): Promise<{ width: number; height: number } | undefined> {
  const TTL = 10000;

  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener('load', () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    });

    img.src = url;

    setTimeout(() => resolve(undefined), TTL);
  });
}
