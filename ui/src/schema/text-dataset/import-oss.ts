import z from 'zod';

import { fileSplitSchema } from '@/schema/text-dataset/import-file.ts';

export const ossType = z.enum(['TOS', 'ALIYUNOSS'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「TOS」、「ALIYUNOSS」' };
      default:
        return { message: '未知错误' };
    }
  },
});

export const importFromOSSSchema = z.object({
  ossType,
  ossConfig: z.object({
    endpoint: z.string().min(1, '请输入 OSS 端点'),
    bucketName: z.string().min(1, '请输入 OSS Bucket Name'),
    accessKeyId: z.string().min(1, '请输入 Access Key ID'),
    accessKeySecret: z.string().min(1, '请输入 Access Key Secret'),
    baseFolder: z.string().min(1, '请输入文件所在目录路径'),
    fileExtensions: z.string().min(1, '请输入文件后缀'),
    excludeFileRegex: z.string().min(1, '请输入过滤文件正则表达式'),

    // region TOS
    region: z.string().min(1, '请输入 TOS 区域').optional(),
    // endregion TOS
  }),

  split: fileSplitSchema,
});

export type IImportFromOSS = z.infer<typeof importFromOSSSchema>;
