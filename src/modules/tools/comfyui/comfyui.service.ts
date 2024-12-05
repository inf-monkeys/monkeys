import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { ComfyuiNode, ComfyuiPrompt, ComfyuiWorkflow, ComfyuiWorkflowWithPrompt } from '@/common/typings/comfyui';
import { readComfyuiWorkflowFromImage, readComfyuiWorkflowFromJsonFile, readComfyuiWorkflowPromptFromJsonFile } from '@/common/utils/comfyui';
import { ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { ComfyuiRepository } from '@/database/repositories/comfyui.repository';
import { ToolProperty, ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import _ from 'lodash';
import { CreateComfyuiServerDto } from './dto/req/create-comfyui-server';
import { RunComfyuiWorkflowExtraOptions } from './dto/req/execute-comfyui-workflow';

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
  constructor(
    private readonly comfyuiWorkflowRepository: ComfyuiRepository,
    @Inject(CACHE_TOKEN) private readonly cache: CacheManager,
  ) { }

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

  private inferInput(node: ComfyuiNode, key: string, value: any, isMixlabWorkflow: boolean = false): ToolProperty {
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
          required: false,
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
          required: false,
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
        return {
          displayName: `${nodeName} - ${key} 模型`,
          name: `${node.id}_${key}`,
          type: 'string',
          default: value,
          required: false,
          typeOptions: {
            comfyOptions: {
              node: node.id,
              key,
            },
          },
        };
      } else if (!isMixlabWorkflow) {
        return {
          displayName: `${nodeName} - ${key}`,
          name: `${node.id}_${key}`,
          type: 'string',
          default: value,
          required: false,
          typeOptions: {
            comfyOptions: {
              node: node.id,
              key,
            },
          },
        };
      }
    } else if (!isMixlabWorkflow) {
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
        required: false,
        typeOptions: {
          comfyOptions: {
            node: node.id,
            key,
          },
        },
      };
    }
  }

  private inferMixlabInput(node: ComfyuiNode, promptInputs: Record<string, any>): ToolProperty {
    const nodeName = node.title || node.properties['Node name for S&R'] || 'Unkonwn Node';
    switch (node.type) {
      case 'IntNumber':
      case 'FloatSlider':
        return {
          displayName: nodeName,
          name: node.id.toString(),
          type: 'number',
          default: promptInputs['number'],
          required: false,
          typeOptions: {
            maxValue: promptInputs['max_value'],
            minValue: promptInputs['min_value'],
            numberPrecision: promptInputs['step'],
            comfyOptions: {
              node: node.id,
              key: 'number',
            },
          },
        };

      case 'TextInput_':
        return {
          displayName: nodeName,
          name: node.id.toString(),
          type: 'string',
          default: promptInputs['text'],
          required: false,
          typeOptions: {
            comfyOptions: {
              node: node.id,
              key: 'text',
            },
          },
        };
    }
  }

  private inferSeedInput(node: ComfyuiNode, promptInputs: Record<string, any>): ToolProperty {
    const nodeName = node.title || node.properties['Node name for S&R'] || 'Unkonwn Node';
    if (['Seed (rgthree)', 'Seed_'].includes(node.type)) {
      return {
        displayName: nodeName,
        name: node.id.toString(),
        type: 'number',
        default: promptInputs['seed'],
        typeOptions: {
          comfyOptions: {
            node: node.id,
            key: 'seed',
          },
        },
      };
    } else {
      return;
    }
  }

  private async generateToolInputByComfyuiWorkflow(_workflow: ComfyuiWorkflowWithPrompt) {
    let inputs: ToolProperty[] = [];
    const newWorkflow = _.cloneDeep(_workflow);
    const prompt: ComfyuiPrompt = newWorkflow.prompt;
    const isMixlabWorkflow = newWorkflow.workflow.nodes.findIndex((node) => ['IntNumber', 'FloatSlider', 'TextInput_'].includes(node.type)) != -1;
    for (const node of newWorkflow.workflow.nodes) {
      const promptInputs: { [x: string]: any } = prompt[node.id!]?.inputs;
      if (!promptInputs) {
        continue;
      }

      // mixlab
      if (isMixlabWorkflow && ['IntNumber', 'FloatSlider', 'TextInput_'].includes(node.type)) {
        const input = this.inferMixlabInput(node, promptInputs);
        if (input) {
          inputs.push(input);
        }
      } else {
        for (const key in promptInputs) {
          const input = this.inferInput(node, key, promptInputs[key], isMixlabWorkflow);
          if (input) {
            inputs.push(input);
          }
        }
      }

      // seed
      for (const key in promptInputs) {
        const input = this.inferSeedInput(node, promptInputs[key]);
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
      return await this.comfyuiWorkflowRepository.createComfyuiWorkflow(teamId, userId, {
        workflowType,
        originalData: { imageUrl },
        workflow: workflow,
        prompt,
        displayName,
        toolInput,
      });
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
      return await this.comfyuiWorkflowRepository.createComfyuiWorkflow(teamId, userId, {
        workflowType,
        originalData: { workflowJsonUrl, workflowApiJsonUrl },
        workflow,
        prompt,
        displayName,
        toolInput,
      });
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
        headers: {
          ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
        },
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

  public async runComfyuiWorkflow(serverAddress: string, worfklowId: string, inputData: { [x: string]: any }, extraOptions: RunComfyuiWorkflowExtraOptions) {
    const comfyuiWorkflow = await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(worfklowId);
    if (!comfyuiWorkflow) {
      throw new Error(`Comfyui workflow not found: ${worfklowId}`);
    }
    const toolInput = comfyuiWorkflow.toolInput;
    const toolOutput = comfyuiWorkflow.toolOutput;
    const { data } = await axios({
      method: 'POST',
      url: '/comfyfile/run',
      baseURL: await this.getBuiltInOrCustomServer(serverAddress),
      data: {
        workflow_api_json: comfyuiWorkflow.prompt,
        workflow_json: comfyuiWorkflow.workflow,
        input_data: inputData,
        comfyfile_repo: comfyuiWorkflow.originalData?.comfyfileRepo,
        input_config: toolInput,
        output_config: toolOutput,
        extra_options: {
          add_monkey_input: extraOptions.addMonkeyInput,
          remove_prompt: extraOptions.removePrompt,
          monkey_info: extraOptions.addMonkeyInput ? extraOptions.monkeyInfo : undefined,
        },
      },
      headers: {
        ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
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
      baseURL: await this.getBuiltInOrCustomServer(serverAddress),
      data: {
        workflow_json: workflow.workflow,
        workflow_api_json: workflow.prompt,
      },
      headers: {
        ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
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
          baseURL: await this.getBuiltInOrCustomServer(serverAddress),
          timeout: 5000,
          headers: {
            ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
          },
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
    serverAddress = await this.getBuiltInOrCustomServer(serverAddress);

    try {
      await axios({
        method: 'GET',
        url: '/manager/reboot',
        baseURL: serverAddress,
        headers: {
          ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
        },
      });
    } catch (error) { }
    await this.waitForComfyuiServerStartup(serverAddress);
  }

  public async installComfyuiDependencies(serverAddress: string, dependencies: { nodes: IComfyuiWorkflowDependencyUninstalledNode[] }) {
    serverAddress = await this.getBuiltInOrCustomServer(serverAddress);

    const succeededNodes: IComfyuiWorkflowDependencyUninstalledNode[] = [];
    for (const node of dependencies.nodes || []) {
      logger.info(`Installing node: ${node.title}(${node.reference})`);
      try {
        await axios({
          method: 'POST',
          url: 'customnode/install',
          baseURL: serverAddress,
          data: node,
          headers: {
            ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
          },
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
      baseURL: await this.getBuiltInOrCustomServer(serverAddress),
      data: {
        comfyfile_repo: comfyuiWorkflow.originalData?.comfyfileRepo,
      },
      headers: {
        ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
      },
    });
    return data;
  }

  public async getBuiltInOrCustomServer(serverAddress: string): Promise<string> {
    if (serverAddress.startsWith('system')) {
      const defaultServer = config.comfyui.defaultServer;

      let cacheServerLists: string[] = [];
      try {
        cacheServerLists = JSON.parse((await this.cache.get(`${config.server.appId}:comfyfile_builtin_servers`)) ?? '[]');
      } catch { }

      const builtInServers = cacheServerLists.length ? cacheServerLists : await this.getAutoDLComfyUIServersAddress();

      const serverLength = builtInServers.length;
      if (serverLength) {
        // 负载均衡
        if (serverLength > 1) {
          return (await this.findApiWithSmallestQueue(builtInServers)) ?? defaultServer;
        } else {
          return builtInServers[0];
        }
      }

      return defaultServer;
    }

    return serverAddress;
  }

  public async getAutoDLComfyUIServersAddress(): Promise<string[]> {
    const autoDLToken = config.comfyui.autodl.token;
    if (autoDLToken) {
      const { data } = await axios({
        method: 'POST',
        url: 'https://www.autodl.com/api/v1/instance',
        headers: {
          Authorization: autoDLToken,
        },
        data: '{"page_index":1,"page_size":10}',
      });

      const machineIds = config?.comfyui?.autodl?.machineIds ?? [];
      const enableFilterMachine = machineIds.length > 0;

      const builtInServers: string[] = [];
      for (const machine of data?.data?.list ?? []) {
        if (enableFilterMachine && !machineIds.some((x) => ((machine?.uuid as string) ?? '').startsWith(x))) {
          continue;
        }

        const domain = machine?.tensorboard_domain;
        if (!domain) continue;
        const finalAddress = `https://${domain}`;
        const { success } = await this.testComfyuiServerConnection(finalAddress);
        if (success) {
          builtInServers.push(finalAddress);
        }
      }

      void this.cache.set(`${config.server.appId}:comfyfile_builtin_servers`, JSON.stringify(builtInServers), 'EX', 60 * 30);

      return builtInServers;
    }
    return [];
  }

  private async getQueueRemaining(apiAddress: string, maxRetries: number = 5): Promise<number | null> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const { data } = await axios.get(`${apiAddress}/prompt`, {
          headers: {
            ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
          },
        });

        if (data && data.exec_info && typeof data.exec_info.queue_remaining === 'number') {
          return data.exec_info.queue_remaining;
        } else {
          attempts++;
        }
      } catch {
        attempts++;
      }
    }
    return null;
  }

  private async findApiWithSmallestQueue(apiAddresses: string[]): Promise<string | null> {
    const queuePromises = apiAddresses.map(async (apiAddress) => {
      const queueRemaining = await this.getQueueRemaining(apiAddress);
      return { apiAddress, queueRemaining };
    });

    const results = await Promise.all(queuePromises);

    const validResults = results.filter((result) => result.queueRemaining !== null) as { apiAddress: string; queueRemaining: number }[];

    if (validResults.length === 0) {
      return null;
    }

    validResults.sort((a, b) => a.queueRemaining - b.queueRemaining);

    return validResults[0].apiAddress;
  }
}
