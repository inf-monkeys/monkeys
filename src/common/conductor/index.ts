import { ConductorClient } from '@io-orkes/conductor-javascript';
import { config } from '../config';

export const conductorClient = new ConductorClient({
  serverUrl: config.conductor.baseUrl,
  USERNAME: config.conductor.auth?.username || undefined,
  PASSWORD: config.conductor.auth?.password || undefined,
});
