import z from 'zod';

export enum ToolImportType {
  manifest = 'manifest',
  openapiSpec = 'openapiSpec',
}

export enum ToolOpenAPISpecType {
  url = 'url',
  upload = 'upload',
  input = 'input',
}

export const importToolSchema = z.object({
  importType: z.string(),
  manifestUrl: z.string().url('必须为合法的链接').optional(),

  // openapi spec
  namespace: z.string().optional(),
  openapiSpecUrl: z.string().url('必须为合法的链接').optional(),
  openapiSpecType: z.string().optional(),
});

export type IImportTool = z.infer<typeof importToolSchema>;
