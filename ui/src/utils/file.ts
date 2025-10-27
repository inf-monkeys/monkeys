export const downloadFile = (file: File | Blob, filename?: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = filename || (file instanceof File ? file.name : 'download');
  link.click();
  URL.revokeObjectURL(url);
};

export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    // 设置 crossOrigin 属性以支持跨域图片加载
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};
