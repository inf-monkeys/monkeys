import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

export function findFilesInDir(startPath: string, filter: string) {
  let results = [];

  // 检查起始路径是否存在
  if (!fs.existsSync(startPath)) {
    logger.info('Directory not found:', startPath);
    return results;
  }

  // 读取起始路径下的所有文件和文件夹
  const files = fs.readdirSync(startPath);

  // 遍历文件和文件夹
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);

    // 如果是文件夹，递归查询
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter)); // 递归
    } else if (filename.endsWith(filter)) {
      // 如果文件符合过滤条件，添加到结果列表
      results.push(filename);
    }
  }

  return results;
}

export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    // 图片类型
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    // 文档类型
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 文本类型
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    // 音视频类型
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    // 压缩文件类型
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  return mimeTypes[ext] || 'binary/octet-stream';
}
