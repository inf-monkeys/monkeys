import { customAlphabet } from 'nanoid';
import SparkMD5 from 'spark-md5';

import { simpleFilePut, simpleGet, simplePost } from '@/apis/non-fetcher.ts';

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

  if (filesize < 4 * 1024 * 1024 * 102) {
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
  const parts: { ETag: string; PartNumber: number }[] = [];

  const load = async (current: number) => {
    const start = current * chunkSize;
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
    return {
      data: file.slice(start, end),
      size: end - start,
    };
  };

  for (let i = 0; i < chunks; i++) {
    const { data, size } = await load(i);
    const currentProcess = ((i + 1) / chunks) * 100;

    const signedUrl = await simplePost<string, Record<string, string | number>>('/api/medias/s3/multipart/part', {
      key: filename,
      uploadId: UploadId,
      partNumber: i + 1,
    });
    const res = await simpleFilePut(signedUrl, <File>data, (process) => {
      // TODO: 进度条
    });
    parts.push({
      PartNumber: i + 1,
      ETag: res.getResponseHeader('ETag'),
    });
    onProgress?.(currentProcess);
  }

  await simplePost<string, Record<string, unknown>>('/api/medias/s3/multipart/complete', {
    key: filename,
    uploadId: UploadId,
    parts,
  });

  return baseUrl + filename;
};
