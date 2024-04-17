export interface IVinesChatSession {
  id: string;
  displayName: string;
  creatorUserId: string;
  teamId: string;
  workflowId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}

export interface IVinesCreateChatSessionParams {
  workflowId: string;
  displayName: string;
}
