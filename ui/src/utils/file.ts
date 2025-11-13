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
    // 先尝试不使用 crossOrigin（适用于相同域或不需要 CORS 的图片）
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // 如果失败，尝试使用 crossOrigin
      const img2 = new Image();
      img2.crossOrigin = 'anonymous';
      img2.onload = () => {
        resolve({ width: img2.naturalWidth, height: img2.naturalHeight });
      };
      img2.onerror = reject;
      img2.src = url;
    };
    img.src = url;
  });
};

export const getThumbUrl = (url: string, enableSystemImageThumbnail: boolean = false) => {
  if (enableSystemImageThumbnail) {
    const systemPrefixAPIPath = '/api/medias/s3/thumbnail';
    const systemPrefixAPIUrl = new URL(systemPrefixAPIPath, window.location.origin);
    systemPrefixAPIUrl.searchParams.set('url', url);
    return systemPrefixAPIUrl.toString();
  } else {
    const urlPath = url.split('/');
    const urlPathLength = urlPath.length;
    return urlPath.map((it, i) => (i === urlPathLength - 2 ? `${it}_thumb` : it)).join('/');
  }
};
