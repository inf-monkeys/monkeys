export interface WorkflowExecutionContext {
  userId: string;
  teamId: string;
  userToken: string;

  // env
  APP_ID: string;
  APP_URL: string;
}
