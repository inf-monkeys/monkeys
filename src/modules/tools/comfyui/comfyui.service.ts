import { ListDto } from '@/common/dto/list.dto';
import { ComfyuiNode, ComfyuiPrompt, ComfyuiWorkflowWithPrompt } from '@/common/typings/comfyui';
import { readComfyuiWorkflowFromImage, readComfyuiWorkflowFromJsonFile, readComfyuiWorkflowPromptFromJsonFile } from '@/common/utils/comfyui';
import { ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { ComfyuiRepository } from '@/database/repositories/comfyui.repository';
import { BlockDefProperties, BlockDefPropertyTypes } from '@inf-monkeys/vines';
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

@Injectable()
export class ComfyUIService {
  constructor(private readonly comfyuiWorkflowRepository: ComfyuiRepository) {}

  public async listComfyuiWorkflows(teamId: string, dto: ListDto) {
    return await this.comfyuiWorkflowRepository.listComfyuiWorkflows(teamId, dto);
  }

  public async deleteComfyuiWorkflow(id: string) {
    await this.comfyuiWorkflowRepository.deleteComfyuiWorkflow(id);
  }

  public async updateComfyuiWorkflowToolInput(id: string, toolInput: BlockDefProperties[]) {
    await this.comfyuiWorkflowRepository.updateComfyuiWorkflowToolInput(id, toolInput);
  }

  private inferInput(node: ComfyuiNode, key: string, value: any): BlockDefProperties {
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
          name: `${node.id}_image`,
          type: 'file',
          default: '',
          required: true,
          typeOptions: {
            // 是否支持多文件上传
            multipleValues: false,
            // 文件类型限制，例如：'.jpg,.png,.gif'
            accept: '.jpg,.jpeg,.png,.webp',
            // 文件数量限制
            // multipleValues 为 false 时，下面两个的值不需要填，因为只能为 1
            minValue: 1,
            maxValue: 1,
            maxSize: 1024 * 1024 * 10,
          },
        };
      } else if (value.endsWith('.mp4') || value.endsWith('.avi') || value.endsWith('.mov')) {
        return {
          displayName: `${nodeName} - 视频`,
          // 格式：节点ID_输入index_类型
          name: `${node.id}_video`,
          type: 'file',
          default: '',
          required: true,
          typeOptions: {
            // 是否支持多文件上传
            multipleValues: false,
            // 文件类型限制，例如：'.jpg,.png,.gif'
            accept: '.mp4,.avi,.mov',
            // 文件数量限制
            // multipleValues 为 false 时，下面两个的值不需要填，因为只能为 1
            minValue: 1,
            maxValue: 1,
            maxSize: 1024 * 1024 * 100,
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
        };
      }
    } else {
      const dataTypeMap: { [x: string]: BlockDefPropertyTypes } = {
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
      };
    }
  }

  private async generateToolInputByComfyuiWorkflow(_workflow: ComfyuiWorkflowWithPrompt) {
    let inputs: BlockDefProperties[] = [];
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
    const getScore = (input: BlockDefProperties) => {
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
    await this.updateComfyuiWorkflowToolInput(workflowId, toolInput);
    return toolInput;
  }

  public async getComfyuiWorkflowById(id: string) {
    return await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(id);
  }

  public async listServers(teamId: string) {
    return await this.comfyuiWorkflowRepository.listServers(teamId);
  }

  private async testComfyuiServerConnection(address: string): Promise<{ success: boolean; errMsg: string }> {
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

  private convertToComfyuiInputData(originalData: { [x: string]: any }, toolInput: BlockDefProperties[]) {
    const result: { [x: string]: { [x: string]: any } } = {};
    for (const key in originalData) {
      const inputItem = toolInput.find((item) => item.name === key);
      if (!inputItem) {
        continue;
      }
      const comfyOptions = inputItem.typeOptions?.comfyOptions;
      if (!comfyOptions) {
        continue;
      }
      const { node: nodeId, key: comfyKey } = comfyOptions;
      if (!result[nodeId]) {
        result[nodeId] = {};
      }
      result[nodeId][comfyKey] = originalData[key];
    }
    return result;
  }

  public async runComfyuiWorkflow(serverAddress: string, worfklowId: string, inputData: { [x: string]: any }) {
    const comfyuiWorkflow = await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(worfklowId);
    if (!comfyuiWorkflow) {
      throw new Error(`Comfyui workflow not found: ${worfklowId}`);
    }
    const prompt = comfyuiWorkflow.prompt;
    if (!prompt) {
      throw new Error(`Comfyui workflow prompt not found: ${worfklowId}`);
    }
    const toolInput = comfyuiWorkflow.toolInput;
    const comfyuiInputData = this.convertToComfyuiInputData(inputData, toolInput);
    const { data } = await axios({
      method: 'POST',
      url: '/comfyfile/run',
      baseURL: serverAddress,
      data: {
        workflow: prompt,
        input_data: comfyuiInputData,
        comfyfile_repo: comfyuiWorkflow.originalData?.comfyfileRepo,
      },
    });
    return data;
  }
}
