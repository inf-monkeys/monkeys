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

export interface IAssetHandler {
  getSnapshot(assetId: string, version: number): Promise<any>;

  cloneFromSnapshot(snapshot: any, teamId: string, userId: string): Promise<AssetCloneResult>;

  remapDependencies(assetId: string, idMapping: { [originalId: string]: string }): Promise<void>;
}
