export interface IVinesChatSession {
  _id: string;
  displayName: string;
  creatorUserId: string;
  teamId: string;
  workflowId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}
