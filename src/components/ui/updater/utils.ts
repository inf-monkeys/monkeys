import SparkMD5 from 'spark-md5';

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
