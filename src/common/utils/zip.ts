import axios from 'axios';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';

export async function downloadAndUnzip(url: string, folder: string) {
  try {
    // 下载 ZIP 文件
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // 使用 JSZip 解压
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(response.data);

    // 遍历 ZIP 文件中的每个项
    const promises = Object.keys(unzipped.files).map(async (filename) => {
      const file = unzipped.files[filename];
      // 跳过目录
      if (file.dir) return;

      const fileData = await file.async('nodebuffer');
      const filePath = path.join(folder, filename);

      // 创建所有必要的目录
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // 将文件写入到文件系统
      fs.writeFileSync(filePath, fileData);
    });
    await Promise.all(promises);

    console.log('Unzipping completed.');
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}
