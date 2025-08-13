import { AssetType } from '@inf-monkeys/monkeys';

export interface SourceAssetReference {
  assetType: AssetType;
  assetId: string;
  version: number;
}

export interface MarketplaceAssetSnapshot {
  [assetType: string]: any[];
}

export interface InstalledAssetInfo {
  [assetType: string]: string[];
}

export interface AssetCloneResult {
  originalId: string;
  newId: string;
}

export interface AssetUpdateResult {
  originalId: string;
}

export interface IAssetHandler {
  getSnapshot(assetId: string, version: number, externalAssetList?: IStagedAssets): Promise<any>;

  cloneFromSnapshot(snapshot: any, teamId: string, userId: string): Promise<AssetCloneResult>;

  updateFromSnapshot(snapshot: any, teamId: string, userId: string, assetId: string): Promise<AssetUpdateResult>;

  remapDependencies(assetId: string, idMapping: { [originalId: string]: string }): Promise<void>;

  getById(assetId: string, teamId: string): Promise<any>;
}

export interface IBaseAssetDto {
  id: string;
  type: AssetType;
  assetVersion: number;
}

export interface IStagedAsset extends IBaseAssetDto {
  appId: string;
  version: string;
  comments?: string;
}

export type IStagedAssets = IStagedAsset[];

export type IStagedAssetWithSnapshot = IStagedAsset & { snapshot: Record<string, any> };
