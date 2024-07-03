import { ToolProperty } from '@inf-monkeys/monkeys';
import fs from 'fs';
import path from 'path';
import { ComfyuiPrompt, ComfyuiWorkflow } from '../typings/comfyui';

export interface ComfyuiPlugin {
  url: string;
}

export interface ComfyuiModel {
  name: string;
  url: string;
  path: string;
}

export interface ComfyfileApp {
  appName: string;
  displayName: string;
  description: string;
  homepage: string;
  plugins: ComfyuiPlugin[];
  models: ComfyuiModel[];
  workflow: ComfyuiWorkflow;
  workflowApi: ComfyuiPrompt;
  tags: string[];
  restEndpoint: {
    parameters?: ToolProperty[];
    output?: ToolProperty[];
  };
}

export const parseComfyfile = (comfyfilePath: string, contextDirectory: string): ComfyfileApp[] => {
  const comfyfile = fs.readFileSync(comfyfilePath, 'utf-8');
  const lines = comfyfile.split('\n');
  const apps: ComfyfileApp[] = [];
  const buildPlugins: ComfyuiPlugin[] = [];
  const buildModels: ComfyuiModel[] = [];
  let currentApp: ComfyfileApp | null = null;

  const parseModelLine = (line: string): ComfyuiModel => {
    const [, path, url] = line.split(' ');
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    return { name, url, path };
  };

  const parseManifestLine = (
    line: string,
  ): {
    appName: string;
    displayName: string;
    description: string;
    homepage: string;
  } => {
    const [, manifestRelativeFile] = line.split(' ');
    const manifestFile = path.join(contextDirectory, manifestRelativeFile.trim());
    const manifestStr = fs.readFileSync(manifestFile, 'utf-8');
    const manifest = JSON.parse(manifestStr);
    return manifest;
  };

  const parseWorkflowLine = (line: string) => {
    const [, workflowRelativeFile] = line.split(' ');
    const workflowFile = path.join(contextDirectory, workflowRelativeFile.trim());
    const workflowStr = fs.readFileSync(workflowFile, 'utf-8');
    const workflow = JSON.parse(workflowStr);
    return workflow;
  };

  const parseWorkflowApiLine = (line: string) => {
    const [, workflowApiRelativeFile] = line.split(' ');
    const workflowApiFile = path.join(contextDirectory, workflowApiRelativeFile.trim());
    const workflowApiStr = fs.readFileSync(workflowApiFile, 'utf-8');
    const workflowApi = JSON.parse(workflowApiStr);
    return workflowApi;
  };

  const parseRestEndpointLine = (line: string) => {
    const [, restEndpointRelativeFile] = line.split(' ');
    const restEndpointFile = path.join(contextDirectory, restEndpointRelativeFile.trim());
    const restEndpointStr = fs.readFileSync(restEndpointFile, 'utf-8');
    const restEndpoint = JSON.parse(restEndpointStr);
    return restEndpoint;
  };

  for (const line of lines) {
    if (line.startsWith('STAGE')) {
      if (line.includes('serve')) {
        if (currentApp) {
          apps.push(currentApp);
        }
        currentApp = {
          appName: '',
          displayName: '',
          description: '',
          homepage: '',
          plugins: [...buildPlugins],
          models: [...buildModels],
          workflow: null,
          workflowApi: null,
          tags: [],
          restEndpoint: null,
        };
      }
    } else if (line.startsWith('PLUGIN')) {
      const [, url] = line.split(' ');
      if (currentApp) {
        currentApp.plugins.push({ url });
      } else {
        buildPlugins.push({ url });
      }
    } else if (line.startsWith('MODEL')) {
      const model = parseModelLine(line);
      if (currentApp) {
        currentApp.models.push(model);
      } else {
        buildModels.push(model);
      }
    } else if (line.startsWith('APP_NAME')) {
      const [, appName] = line.split(' ');
      if (currentApp) {
        currentApp.appName = appName;
      }
    } else if (line.startsWith('MANIFEST')) {
      const manifest = parseManifestLine(line);
      if (currentApp) {
        if (manifest.appName) {
          currentApp.appName = manifest.appName;
        }
        currentApp.displayName = manifest.displayName;
        currentApp.description = manifest.description;
        currentApp.homepage = manifest.homepage;
      }
    } else if (line.startsWith('WORKFLOW_API')) {
      const workflowApi = parseWorkflowApiLine(line);
      if (currentApp) {
        currentApp.workflowApi = workflowApi;
      }
    } else if (line.startsWith('WORKFLOW')) {
      const workflow = parseWorkflowLine(line);
      if (currentApp) {
        currentApp.workflow = workflow;
      }
    } else if (line.startsWith('REST_ENDPOINT')) {
      const restEndpoint = parseRestEndpointLine(line);
      if (currentApp) {
        currentApp.restEndpoint = restEndpoint;
      }
    }
  }

  if (currentApp) {
    apps.push(currentApp);
  }

  return apps;
};
