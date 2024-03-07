import { ConductorClient } from '@io-orkes/conductor-javascript';
import { config } from '../config';

export const conductorClient = new ConductorClient({
  serverUrl: config.conductor.baseUrl,
});
