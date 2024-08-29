import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { ComfyuiNode, ComfyuiPrompt, ComfyuiWorkflow, ComfyuiWorkflowWithPrompt } from '@/common/typings/comfyui';
import { readComfyuiWorkflowFromImage, readComfyuiWorkflowFromJsonFile, readComfyuiWorkflowPromptFromJsonFile } from '@/common/utils/comfyui';
import { ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { ComfyuiRepository } from '@/database/repositories/comfyui.repository';
import { ToolProperty, ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import _ from 'lodash';
import { CreateComfyuiServerDto } from './dto/req/create-comfyui-server';

export interface ImportComfyuiWorkflowParams {
  displayName?: string;
  workflowType: ComfyuiWorkflowSourceType;
  imageUrl?: string;
  workflowApiJsonUrl?: string;
  workflowJsonUrl?: string;
}

export interface IComfyuiWorkflowDependencyUninstalledNode {
  author: string;
  title: string;
  id: string;
  reference: string;
  files: string[];
  install_type: string;
  description: string;
  stars: number;
  last_update: string;
  installed: 'False';
}

@Injectable()
export class ComfyUIService {
  constructor(private readonly comfyuiWorkflowRepository: ComfyuiRepository) {}

  public async listComfyuiWorkflows(teamId: string, dto: ListDto) {
    return await this.comfyuiWorkflowRepository.listComfyuiWorkflows(teamId, dto);
  }

  public async deleteComfyuiWorkflow(id: string) {
    await this.comfyuiWorkflowRepository.deleteComfyuiWorkflow(id);
  }

  public async updateComfyuiWorkflow(
    id: string,
    updates: {
      toolInput?: ToolProperty[];
      toolOutput?: ToolProperty[];
      workflow?: ComfyuiWorkflow;
      workflowApi?: ComfyuiPrompt;
    },
  ) {
    await this.comfyuiWorkflowRepository.updateComfyuiWorkflow(id, updates);
  }

  private inferInput(node: ComfyuiNode, key: string, value: any): ToolProperty {
    if (node.type === 'LoadImage' && key === 'upload') {
      return;
    }

    if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') {
      // Link, ignore
      return;
    }
    const nodeName = node.title || node.properties['Node name for S&R'] || 'Unkonwn Node';
    const MODEL_FILETYPES = ['.ckpt', '.safetensors', '.pt', '.pth', '.bin', '.onnx', '.torchscript', '.patch', '.gguf', '.ggml'];
    const dataType = typeof value;
    if (dataType === 'string') {
      if (value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.png') || value.endsWith('.webp')) {
        return {
          displayName: `${nodeName} - 图片`,
          // 格式：节点ID_输入index_类型
          name: `${node.id}_${key}`,
          type: 'file',
          default: '',
          required: true,
          typeOptions: {
            multipleValues: false,
            accept: '.jpg,.jpeg,.png,.webp',
            minValue: 1,
            maxValue: 1,
            maxSize: 1024 * 1024 * 10,
            comfyOptions: {
              node: node.id,
              key,
            },
          },
        };
      } else if (value.endsWith('.mp4') || value.endsWith('.avi') || value.endsWith('.mov')) {
        return {
          displayName: `${nodeName} - 视频`,
          // 格式：节点ID_输入index_类型
          name: `${node.id}_${key}`,
          type: 'file',
          default: '',
          required: true,
          typeOptions: {
            // 是否支持多文件上传
            multipleValues: false,
            accept: '.mp4,.avi,.mov',
            minValue: 1,
            maxValue: 1,
            maxSize: 1024 * 1024 * 100,
            comfyOptions: {
              node: node.id,
              key,
            },
          },
        };
      } else if (MODEL_FILETYPES.some((x) => value.endsWith(x))) {
        // Ignore Models
      } else {
        return {
          displayName: `${nodeName} - ${key}`,
          name: `${node.id}_${key}`,
          type: 'string',
          default: value,
          required: true,
          typeOptions: {
            comfyOptions: {
              node: node.id,
              key,
            },
          },
        };
      }
    } else {
      const dataTypeMap: { [x: string]: ToolPropertyTypes } = {
        number: 'number',
        boolean: 'boolean',
        object: 'json',
      };
      return {
        displayName: `${nodeName} - ${key}`,
        name: `${node.id}_${key}`,
        type: dataTypeMap[dataType] || 'string',
        default: value,
        required: true,
        typeOptions: {
          comfyOptions: {
            node: node.id,
            key,
          },
        },
      };
    }
  }

  private async generateToolInputByComfyuiWorkflow(_workflow: ComfyuiWorkflowWithPrompt) {
    let inputs: ToolProperty[] = [];
    const newWorkflow = _.cloneDeep(_workflow);
    const prompt: ComfyuiPrompt = newWorkflow.prompt;
    for (const node of newWorkflow.workflow.nodes) {
      const promptInputs: { [x: string]: any } = prompt[node.id!]?.inputs;
      if (!promptInputs) {
        continue;
      }
      for (const key in promptInputs) {
        const input = this.inferInput(node, key, promptInputs[key]);
        if (input) {
          inputs.push(input);
        }
      }
    }
    const getScore = (input: ToolProperty) => {
      if (input.type === 'file') {
        return 2;
      }
      const [nodeId] = input.name.split('_');
      // node id 越小越在前面，数越大
      if (!isNaN(parseInt(nodeId))) {
        return 1 - parseInt(nodeId) / 10000;
      }
      return 0;
    };

    // 把图片输入放在最前面
    inputs = inputs.sort((a, b) => {
      const aScore = getScore(a);
      const bScore = getScore(b);
      return bScore - aScore;
    });

    return inputs;
  }

  public async importComfyuiWorkflow(teamId: string, userId: string, params: ImportComfyuiWorkflowParams) {
    const { workflowType, imageUrl, displayName, workflowApiJsonUrl, workflowJsonUrl } = params;
    if (workflowType === 'image') {
      const { workflow, prompt } = await readComfyuiWorkflowFromImage(imageUrl);
      const toolInput = await this.generateToolInputByComfyuiWorkflow({ workflow, prompt });
      const comfyuiWorkflow = await this.comfyuiWorkflowRepository.createComfyuiWorkflow(teamId, userId, {
        workflowType,
        originalData: { imageUrl },
        workflow: workflow,
        prompt,
        displayName,
        toolInput,
      });
      return comfyuiWorkflow;
    } else if (workflowType === 'json') {
      const workflow = await readComfyuiWorkflowFromJsonFile(workflowJsonUrl);
      if (!workflow?.links || !workflow?.nodes) {
        throw new Error('Invalid ComfyUI JSON file');
      }
      const prompt = await readComfyuiWorkflowPromptFromJsonFile(workflowApiJsonUrl);
      if (!prompt || typeof prompt !== 'object') {
        throw new Error('Invalid ComfyUI API JSON file');
      }
      const toolInput = await this.generateToolInputByComfyuiWorkflow({ workflow, prompt });
      const comfyuiWorkflow = await this.comfyuiWorkflowRepository.createComfyuiWorkflow(teamId, userId, {
        workflowType,
        originalData: { workflowJsonUrl, workflowApiJsonUrl },
        workflow,
        prompt,
        displayName,
        toolInput,
      });
      return comfyuiWorkflow;
    }
  }

  public async autoGenerateToolInput(workflowId: string) {
    const comfyuiWorkflow = await this.getComfyuiWorkflowById(workflowId);
    const { workflow, prompt } = comfyuiWorkflow;
    const toolInput = await this.generateToolInputByComfyuiWorkflow({ workflow, prompt });
    await this.updateComfyuiWorkflow(workflowId, {
      toolInput,
    });
    return toolInput;
  }

  public async getComfyuiWorkflowById(id: string) {
    return await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(id);
  }

  public async listServers(teamId: string) {
    return await this.comfyuiWorkflowRepository.listServers(teamId);
  }

  public async listAllServers() {
    return await this.comfyuiWorkflowRepository.listAllServers();
  }

  public async getComfyuiServerById(teamId: string | null, serverId: string) {
    return await this.comfyuiWorkflowRepository.getComfyuiServerById(teamId, serverId);
  }

  public async testComfyuiServerConnection(address: string): Promise<{ success: boolean; errMsg: string }> {
    try {
      await axios({
        method: 'GET',
        url: '/comfyfile/healthz',
        baseURL: address,
        timeout: 5000,
      });
      return {
        success: true,
        errMsg: '',
      };
    } catch (error) {
      return {
        success: false,
        errMsg: error.message,
      };
    }
  }

  public async createComfyuiServer(teamId: string, userId: string, data: CreateComfyuiServerDto) {
    const { success, errMsg } = await this.testComfyuiServerConnection(data.address);
    if (!success) {
      throw new Error(
        `Failed to connect to ComfyUI server: ${errMsg}, have you installed the Comfyfile plugin (https://github.com/inf-monkeys/Comfyfile)? And make sure comfyui is listening on 0.0.0.0`,
      );
    }
    return await this.comfyuiWorkflowRepository.createComfyuiServer(teamId, userId, data);
  }

  public async deleteComfyuiServer(teamId: string, address: string) {
    return await this.comfyuiWorkflowRepository.deleteComfyuiServer(teamId, address);
  }

  public async runComfyuiWorkflow(serverAddress: string, worfklowId: string, inputData: { [x: string]: any }) {
    const comfyuiWorkflow = await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(worfklowId);
    if (!comfyuiWorkflow) {
      throw new Error(`Comfyui workflow not found: ${worfklowId}`);
    }
    const toolInput = comfyuiWorkflow.toolInput;
    const toolOutput = comfyuiWorkflow.toolOutput;
    const { data } = await axios({
      method: 'POST',
      url: '/comfyfile/run',
      baseURL: serverAddress,
      data: {
        workflow_api_json: comfyuiWorkflow.prompt,
        workflow_json: comfyuiWorkflow.workflow,
        input_data: inputData,
        comfyfile_repo: comfyuiWorkflow.originalData?.comfyfileRepo,
        input_config: toolInput,
        output_config: toolOutput,
      },
    });
    return data;
  }

  public async checkComfyuiDependencies(id: string, serverAddress: string) {
    const workflow = await this.getComfyuiWorkflowById(id);
    if (!workflow) {
      throw new Error(`Comfyui workflow not found: ${id}`);
    }
    const { data } = await axios({
      method: 'POST',
      url: '/comfyfile/check-dependencies',
      baseURL: serverAddress,
      data: {
        workflow_json: workflow.workflow,
        workflow_api_json: workflow.prompt,
      },
    });
    return data;
  }

  private async waitForComfyuiServerStartup(serverAddress: string) {
    let success = false;
    let errMsg = '';
    for (let i = 0; i < 10; i++) {
      logger.info(`Waiting for ComfyUI server to start...`);
      try {
        await axios({
          method: 'GET',
          url: '/comfyfile/healthz',
          baseURL: serverAddress,
          timeout: 5000,
        });
        success = true;
        break;
      } catch (error) {
        errMsg = error.message;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    if (!success) {
      throw new Error(`Failed to start ComfyUI server: ${errMsg}`);
    }
  }

  private async rebootComfyuiServer(serverAddress: string) {
    try {
      await axios({
        method: 'GET',
        url: '/manager/reboot',
        baseURL: serverAddress,
      });
    } catch (error) {}
    await this.waitForComfyuiServerStartup(serverAddress);
  }

  public async installComfyuiDependencies(serverAddress: string, dependencies: { nodes: IComfyuiWorkflowDependencyUninstalledNode[] }) {
    const succeededNodes: IComfyuiWorkflowDependencyUninstalledNode[] = [];
    for (const node of dependencies.nodes || []) {
      logger.info(`Installing node: ${node.title}(${node.reference})`);
      try {
        await axios({
          method: 'POST',
          url: 'customnode/install',
          baseURL: serverAddress,
          data: node,
        });
        succeededNodes.push(node);
      } catch (error) {
        logger.error(`Failed to install node: ${node.title}(${node.reference})`, error.message);
      }
    }

    if (succeededNodes.length) {
      logger.info(`Successfully installed nodes: ${succeededNodes.map((x) => x.title).join(',')}, rebooting ComfyUI server...`);
      await this.rebootComfyuiServer(serverAddress);
    }
  }

  public async installComfyfile(serverAddress: string, workflowId: string) {
    const comfyuiWorkflow = await this.getComfyuiWorkflowById(workflowId);
    if (!comfyuiWorkflow) {
      throw new Error(`Comfyui workflow not found: ${workflowId}`);
    }
    const { data } = await axios({
      method: 'POST',
      url: '/comfyfile/apps',
      baseURL: serverAddress,
      data: {
        comfyfile_repo: comfyuiWorkflow.originalData?.comfyfileRepo,
      },
    });
    return data;
  }
}
