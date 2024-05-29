import z from 'zod';

export enum ToolImportType {
  manifest = 'manifest',
  openapiSpec = 'openapiSpec',
  api = 'api',
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

  // api
  toolName: z.string().optional(),
  apiInfo: z.object({
    displayName: z.string().optional(),
    description: z.string().optional(),
    url: z.string().url('必须为合法的链接').optional(),
    method: z.string().optional(),
    credentialPlaceAt: z.string().optional(),
    credentialKey: z.string().optional(),
    credentialValue: z.string().optional(),
    proprities: z.any().optional(),
    output: z.any().optional(),
  }),
});

export type IImportTool = z.infer<typeof importToolSchema>;
