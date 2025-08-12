import { AssetType } from '@inf-monkeys/monkeys';
import z from 'zod';

export const exportAssetSchema = z.object({
  id: z.string(),
  type: z.custom<AssetType>(),
  assetVersion: z.number(),
  appId: z.string().min(1, 'App ID cannot be empty'),
  version: z.string().min(1, 'Version cannot be empty'),
  comments: z.string().optional(),
});

export type IExportAsset = z.infer<typeof exportAssetSchema>;

export const exportAssetsSchema = z.object({
  assets: z.array(exportAssetSchema),
});

export type IExportAssets = z.infer<typeof exportAssetsSchema>;
