export class OneApiClient {
  baseURL: string;
  username: string;
  password: string;

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = baseURL;
    this.username = username;
    this.password = password;
  }
}
