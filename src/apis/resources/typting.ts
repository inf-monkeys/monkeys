export interface IMd5Response {
  _id: string;
  assetType: string;
  teamId: string;
  creatorUserId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  iconUrl: string;
  name: string;
  description: string;
  isDeleted: boolean;
  type: string;
  url: string;
  source: number;
  size: number;
  params: {
    width: number;
    height: number;
  };
  md5: string;
}
