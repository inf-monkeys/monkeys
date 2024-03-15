export interface IVinesDataset {
  _id: string;
  name: string;
  teamId: string;
  fileIds: string[];
  createdTimestamp?: number;
  updatedTimestamp?: number;
  isDeleted?: boolean;
}
