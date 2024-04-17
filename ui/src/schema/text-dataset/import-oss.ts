import z from 'zod';

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

export const bucketType = z.enum(['private', 'public'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「private」、「public」' };
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
    bucketType,
    accessKeyId: z.string().min(1, '请输入 Access Key ID'),
    accessKeySecret: z.string().min(1, '请输入 Access Key Secret'),
    baseFolder: z.string().min(1, '请输入文件所在目录路径'),
    fileExtensions: z.string().min(1, '请输入文件后缀').optional(),
    excludeFileRegex: z.string().min(1, '请输入过滤文件正则表达式').optional(),

    // region TOS
    region: z.string().min(1, '请输入 TOS 区域').optional(),
    // endregion TOS
  }),

  splitterType: z.enum(['custom-segment', 'auto-segment']),
  preProcessRules: z.array(z.string()).optional(),
  splitterConfig: z
    .object({
      chunk_overlap: z.number().min(5, '分段重叠长度至少为 5').max(1000, '分段重叠长度最多为 1000').optional(),
      chunk_size: z.number().max(2000, '分段最大长度最多为 2000').optional(),
      separator: z.string().optional(),
    })
    .optional(),
});

export type IImportFromOSS = z.infer<typeof importFromOSSSchema>;
