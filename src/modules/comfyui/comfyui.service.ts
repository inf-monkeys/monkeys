import { logger } from '@/common/logger';
import { ComfyuiNodeType, ComfyuiNodesNoNeedInstall, ComfyuiPrompt, ComfyuiWorkflowWithPrompt } from '@/common/typings/comfyui';
import { readComfyuiWorkflowFromImage, readComfyuiWorkflowFromJsonFile, readComfyuiWorkflowPromptFromJsonFile } from '@/common/utils/comfyui';
import { areArraysEqual, generateRandomString } from '@/common/utils/utils';
import { ToolsEntity } from '@/entities/tools/tools.entity';
import { AssetType, BlockDefProperties, BlockDefPropertyTypes, BlockType } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { ComfyuiRepository } from '../../repositories/comfyui.repository';
import { ToolsRepository } from '../../repositories/tools.repository';
import { ComfyuiWorkflowFileType } from './dto/req/import-from-comfyui.dto';
import { ComfyuiDepencency, ComfyuiDepencencyType, ImportFromComfyuiParams, LoadComfyuiWorkflowParams, UpdateComfyuiWorkflowParams } from './interfaces';

@Injectable()
export class ComfyuiService {
  constructor(
    private readonly comfyuiRepository: ComfyuiRepository,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  public async registerServer(teamId: string, displayName: string, baseUrl: string) {
    // Do health check
    const healthCheckUrl = '/monkeys/healthz';
    await axios.get(healthCheckUrl, {
      baseURL: baseUrl,
    });

    await this.comfyuiRepository.registerServer(teamId, displayName, baseUrl);
  }

  public async listServers(teamId: string) {
    return await this.comfyuiRepository.listComfyuiServers(teamId);
  }

  public async request(baseUrl: string, config: AxiosRequestConfig) {
    console.log(`Request ComfyUI API: method=${config.method || 'GET'}, url=${config.url}`);
    config.baseURL = baseUrl;
    const { data } = await axios(config);
    return data;
  }

  public async loadAllModels(serverName: string) {
    const server = await this.comfyuiRepository.getServer(serverName);
    const data = await this.request(server.baseUrl, {
      url: '/monkey/all-models',
    });
    return data;
  }

  public isModel(allModels: { [x: string]: string[] }, options: string[]): string | undefined {
    if (options.length === 0) {
      return undefined;
    }
    for (const modelType in allModels) {
      // 有些 block 会手动放一个 None 在这上面
      options = options.filter((x) => x !== 'None');
      if (areArraysEqual(allModels[modelType], options)) {
        return `comfyui-model-${modelType}`;
      }
    }
    return undefined;
  }

  private async loadComfyuiWorkflow(params: LoadComfyuiWorkflowParams) {
    const { fileType, workflowApiJsonUrl, workflowJsonUrl, imageUrl } = params;
    let comfyuiWorkflowWithPrompt: ComfyuiWorkflowWithPrompt;
    if (fileType === ComfyuiWorkflowFileType.IMAGE) {
      if (!imageUrl) {
        throw new Error('请上传包含 comfyui 工作流信息的图片');
      }
      try {
        comfyuiWorkflowWithPrompt = await readComfyuiWorkflowFromImage(imageUrl);
      } catch {}
      // TODO: 支持导入 webp 等其他格式文件（看 comfyui 前端代码）
      if (!comfyuiWorkflowWithPrompt?.prompt || !comfyuiWorkflowWithPrompt?.workflow) {
        throw new Error('不支持的图像，此图像不包含 comfyui 工作流信息');
      }
    } else if (fileType === ComfyuiWorkflowFileType.JSON) {
      if (!workflowJsonUrl) {
        throw new Error('请上传包含 ComfyUI 工作流 JSON 文件');
      }
      if (!workflowApiJsonUrl) {
        throw new Error('请上传包含 ComfyUI API JSON 文件');
      }
      const workflowJson = await readComfyuiWorkflowFromJsonFile(workflowJsonUrl);
      if (!workflowJson?.links || !workflowJson?.nodes) {
        throw new Error('不合法的 ComfyUI 工作流 JSON 文件');
      }
      const prompt = await readComfyuiWorkflowPromptFromJsonFile(workflowApiJsonUrl);
      if (!prompt || typeof prompt !== 'object') {
        throw new Error('不合法的 ComfyUI API JSON 文件');
      }
      comfyuiWorkflowWithPrompt = {
        workflow: workflowJson,
        prompt,
      };
    }
    return comfyuiWorkflowWithPrompt;
  }

  private async generateInputByComfyuiWorkflow(
    baseUrl: string,
    _workflow: ComfyuiWorkflowWithPrompt,
  ): Promise<{
    input: BlockDefProperties[];
    replacedWorkflow: ComfyuiWorkflowWithPrompt;
  }> {
    let input: BlockDefProperties[] = [];
    const newWorkflow = _.cloneDeep(_workflow);
    const prompt: ComfyuiPrompt = newWorkflow.prompt;
    const objectInfoData = await this.request(baseUrl, {
      url: '/object_info',
    });
    const allModels = await this.loadAllModels(baseUrl);
    for (const node of newWorkflow.workflow.nodes) {
      const nodeName = node.title || node.properties['Node name for S&R'];
      const nodeType = node.type;
      const promptInputs: { [x: string]: any } = prompt[node.id!]?.inputs;
      if (!promptInputs) {
        continue;
      }
      if (node.type === ComfyuiNodeType.LoadImage) {
        input.push({
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
        });
        promptInputs.image = `{{${node.id}_image}}`;
      } else if (node.type === ComfyuiNodeType.SaveImage) {
        promptInputs.filename_prefix = '{{outputPrefix}}';
      } else if (node.type === ComfyuiNodeType.VHS_LoadVideo || node.type === ComfyuiNodeType.VHS_LoadVideoPath) {
        input.push({
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
            accept: '.mp4',
            // 文件数量限制
            // multipleValues 为 false 时，下面两个的值不需要填，因为只能为 1
            minValue: 1,
            maxValue: 1,
            maxSize: 1024 * 1024 * 100,
          },
        });
        promptInputs.video = `{{${node.id}_video}}`;
      } else {
        const nodeInfo = objectInfoData[nodeType];
        if (nodeInfo) {
          const { required: requiredNodeInput } = nodeInfo.input;
          const dataTypeMap: { [x: string]: BlockDefPropertyTypes } = {
            INT: 'number',
            FLOAT: 'number',
            STRING: 'string',
            BOOLEAN: 'boolean',
          };
          for (const promptInputKey in promptInputs) {
            const promptInputKeyValue = promptInputs[promptInputKey];
            // ["1", 0] 这种形式表示连线
            if (Array.isArray(promptInputKeyValue) && typeof promptInputKeyValue[0] === 'string' && typeof promptInputKeyValue[1] === 'number') {
              // 这种情况下不做处理
            } else {
              // 找到  node 定义的类型
              const nodeInputItem = requiredNodeInput[promptInputKey];
              if (!nodeInputItem) {
                logger.info(`${node.type} 的 ${promptInputKey} 没有对应的入参定义`);
              } else {
                const dataTypeOrEnum = nodeInputItem[0];
                if (dataTypeMap[dataTypeOrEnum]) {
                  input.push({
                    displayName: `${nodeName} - ${promptInputKey}`,
                    // 格式：节点ID_输入index_类型
                    name: `${node.id}_${promptInputKey}`,
                    type: dataTypeMap[dataTypeOrEnum],
                    default: promptInputKeyValue,
                    required: true,
                  });
                  promptInputs[promptInputKey] = `{{${node.id}_${promptInputKey}}}`;
                } else if (Array.isArray(dataTypeOrEnum)) {
                  const modelName = this.isModel(allModels, dataTypeOrEnum);
                  if (modelName) {
                    input.push({
                      displayName: `${nodeName} - ${promptInputKey}`,
                      // 格式：节点ID_输入index_类型
                      name: `${node.id}_${promptInputKey}`,
                      type: 'string',
                      default: promptInputKeyValue,
                      required: true,
                      typeOptions: {
                        assetType: modelName as AssetType,
                      },
                    });
                  } else {
                    input.push({
                      displayName: `${nodeName} - ${promptInputKey}`,
                      // 格式：节点ID_输入index_类型
                      name: `${node.id}_${promptInputKey}`,
                      type: 'options',
                      default: promptInputKeyValue,
                      required: true,
                      options: dataTypeOrEnum.map((x) => {
                        const realValue = Array.isArray(x) ? x[0] : x;
                        return {
                          name: realValue,
                          value: realValue,
                        };
                      }),
                    });
                  }
                  promptInputs[promptInputKey] = `{{${node.id}_${promptInputKey}}}`;
                }
              }
            }
          }
        }
      }

      prompt[node.id!].inputs = promptInputs;
    }

    newWorkflow.prompt = prompt;

    const getScore = (input: BlockDefProperties) => {
      if (input.type === 'file') {
        return 2;
      }
      if (input.typeOptions?.assetType?.startsWith('comfyui-model')) {
        return 1;
      }
      const [nodeId] = input.name.split('_');
      // node id 越小越在前面，数越大
      if (!isNaN(parseInt(nodeId))) {
        return 1 - parseInt(nodeId) / 10000;
      }
      return 0;
    };

    // 把图片输入放在最前面
    input = input.sort((a, b) => {
      const aScore = getScore(a);
      const bScore = getScore(b);
      return bScore - aScore;
    });

    return {
      input,
      replacedWorkflow: newWorkflow,
    };
  }

  public async generateToolByComfyuiWorkflow(teamId: string, creatorUserId: string, serverName: string, params: ImportFromComfyuiParams) {
    const { fileType, workflowApiJsonUrl, workflowJsonUrl, imageUrl, description, displayName, icon } = params;
    const comfyuiWorkflowWithPrompt = await this.loadComfyuiWorkflow({
      fileType,
      imageUrl,
      workflowApiJsonUrl,
      workflowJsonUrl,
    });
    const server = await this.comfyuiRepository.getServer(serverName);
    const name = `monkey_tools_nodejs__comfyui_${generateRandomString(10)}`;
    const { input, replacedWorkflow } = await this.generateInputByComfyuiWorkflow(server.baseUrl, comfyuiWorkflowWithPrompt);
    const entity: ToolsEntity = {
      id: new ObjectId(),
      namespace: 'monkey_tools_nodejs',
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      teamId,
      creatorUserId,
      public: false,
      isDeleted: false,
      type: BlockType.SIMPLE,
      name: name,
      displayName: displayName,
      description: description,
      icon: icon || 'https://static.aside.fun/upload/frame/icon.svg',
      input,
      output: [
        {
          name: 'result',
          displayName: '图像 URL 列表',
          type: 'string',
          typeOptions: {
            multipleValues: true,
          },
        },
      ],
      extra: {
        __originalComfyuiWorkflow: comfyuiWorkflowWithPrompt,
        __comfyuiWorkflow: replacedWorkflow,
        __apiInfo: {
          method: 'post',
          path: '/comfyui/prompt',
        },
      },
    };
    await this.toolsRepository.createTool(entity);
    return name;
  }

  public async reuploadComfyuiWorkflow(toolName: string, serverName: string, params: UpdateComfyuiWorkflowParams) {
    const { fileType, workflowApiJsonUrl, workflowJsonUrl, imageUrl } = params;
    const tool = await this.toolsRepository.getToolByName(toolName);
    const server = await this.comfyuiRepository.getServer(serverName);

    if (!tool) {
      throw new Error(`Tool ${tool} 不存在`);
    }
    const comfyuiWorkflowWithPrompt = await this.loadComfyuiWorkflow({
      fileType,
      imageUrl,
      workflowApiJsonUrl,
      workflowJsonUrl,
    });
    const { input, replacedWorkflow } = await this.generateInputByComfyuiWorkflow(server.baseUrl, comfyuiWorkflowWithPrompt);
    const extra = {
      ...(tool.extra || {}),
      __originalComfyuiWorkflow: comfyuiWorkflowWithPrompt,
      __comfyuiWorkflow: replacedWorkflow,
    };
    await this.toolsRepository.updateTool(toolName, {
      extra,
      input,
    });
    return true;
  }

  public async refreshToolInput(toolName: string, serverName: string) {
    const tool = await this.toolsRepository.getToolByName(toolName);
    if (!tool) {
      throw new Error(`Tool ${tool} 不存在`);
    }
    const server = await this.comfyuiRepository.getServer(serverName);
    const { input, replacedWorkflow } = await this.generateInputByComfyuiWorkflow(server.baseUrl, tool.extra.__originalComfyuiWorkflow);
    const extra = {
      ...(tool.extra || {}),
      __comfyuiWorkflow: replacedWorkflow,
    };
    await this.toolsRepository.updateTool(toolName, {
      extra,
      input,
    });
    return true;
  }

  private async getNodeList(baseUrl: string) {
    const data = await this.request(baseUrl, {
      url: '/object_info',
      method: 'GET',
    });
    return data;
  }

  public async getExternalModels(baseUrl: string, workflow: ComfyuiWorkflowWithPrompt): Promise<any[]> {
    const modelListData = await this.request(baseUrl, {
      url: '/externalmodel/getlist?mode=cache',
    });
    const modelListInComfyuiManager = modelListData.models;
    const modelNamesInComfyuiManager = modelListInComfyuiManager.map((x) => x.filename);
    const allModels = await this.loadAllModels(baseUrl);
    const allModelNames = [];
    for (const key in allModels) {
      allModelNames.push(...allModels[key]);
    }
    const objectInfoData = await this.request(baseUrl, {
      url: '/object_info',
    });

    const allModelIncluded: Array<{ type: string; value: string }> = [];
    for (const node of workflow.workflow.nodes) {
      const nodeType = node.type;
      const inputs: { [x: string]: any } = workflow.prompt[node.id!]?.inputs;
      if (!inputs) {
        continue;
      }
      const nodeInfo = objectInfoData[nodeType];
      if (nodeInfo) {
        const { required: requiredNodeInput } = nodeInfo.input;
        let keyIndex = 0;
        for (const key in requiredNodeInput) {
          const defaultValueFromWidgetValues = node.widgets_values?.[keyIndex];
          const inputItem = requiredNodeInput[key];
          const dataTypeOrEnum = inputItem[0];
          const dataTypeMap: { [x: string]: BlockDefPropertyTypes } = {
            INT: 'number',
            FLOAT: 'number',
            STRING: 'string',
            BOOLEAN: 'boolean',
          };
          if (dataTypeMap[dataTypeOrEnum]) {
            keyIndex += 1;
          } else if (Array.isArray(dataTypeOrEnum)) {
            // 此字段是一个模型
            const modelType = this.isModel(allModels, dataTypeOrEnum);
            if (modelType) {
              const defaultValue = defaultValueFromWidgetValues !== undefined ? defaultValueFromWidgetValues : dataTypeOrEnum[0];
              allModelIncluded.push({
                value: defaultValue,
                type: modelType.replace('comfyui-model-', ''),
              });
            }
            keyIndex += 1;
          }
        }
      }
    }
    const modelsInComfyUIManager = modelListInComfyuiManager
      .filter((x) => allModelIncluded.map((x) => x.value).includes(x.filename))
      .map((x) => {
        if (allModelNames.includes(x.filename)) {
          x.installed = 'True';
        }
        return x;
      });
    let result = [...modelsInComfyUIManager];
    const modelsNotInComfyUI = allModelIncluded.filter((x) => {
      return !modelNamesInComfyuiManager.includes(x.value);
    });
    result = result.concat(modelsNotInComfyUI.map((x) => ({ filename: x.value, type: x.type, installed: allModelNames.includes(x.value) ? 'True' : 'False', notFoundInComfyuiManager: true })));
    return result;
  }

  public async getExternalNodes(baseUrl: string, workflow: ComfyuiWorkflowWithPrompt): Promise<any[]> {
    const customNodeListData = await this.request(baseUrl, {
      url: '/customnode/getlist?mode=cache&skip_update=true',
      method: 'GET',
    });
    const customnodeMappingData = await this.request(baseUrl, {
      url: '/customnode/getmappings?mode=cache',
      method: 'GET',
    });
    const installedNodeList = await this.getNodeList(baseUrl);
    const installedNodeNames = Object.keys(installedNodeList);
    const allCustomNodes: Array<{
      title: string;
      name: string;
    }> = [];
    for (const file in customnodeMappingData) {
      const customNodeNames = customnodeMappingData[file][0];
      const title = customnodeMappingData[file][1].title_aux;
      for (const customNodeName of customNodeNames) {
        allCustomNodes.push({
          title: title,
          name: customNodeName,
        });
      }
    }
    // 在 ComfyUI-Manager 中的节点
    const customNodesInWorkflow = workflow.workflow.nodes.filter((node) => allCustomNodes.map((x) => x.name).includes(node.type)).map((x) => x.type);
    const customNodeTitles = _.uniq(
      customNodesInWorkflow
        .map((nodeName) => {
          const item = allCustomNodes.find((x) => x.name === nodeName);
          if (!item) {
            return null;
          }
          return item.title;
        })
        .filter(Boolean),
    );
    // 还有一些可能不在，也需要上传
    console.log('所有 Comfyui 自定义节点: ', customNodeTitles);
    const customNodeConfigs = customNodeListData.custom_nodes.filter((x) => customNodeTitles.includes(x.title));
    const uninstalledNodesAndNotInComfyUIManager = workflow.workflow.nodes
      .filter((x) => !installedNodeNames.includes(x.type) && !customNodeTitles.includes(x.type))
      .filter((x) => !ComfyuiNodesNoNeedInstall.includes(x.type));
    let result = [...customNodeConfigs];
    result = result.concat(uninstalledNodesAndNotInComfyUIManager.map((x) => ({ title: x.type, installed: 'False', notFoundInComfyuiManager: true })));
    return result;
  }

  public async checkComfyuiWorkflowDependencies(serverName: string, workflow: ComfyuiWorkflowWithPrompt): Promise<ComfyuiDepencency[]> {
    const server = await this.comfyuiRepository.getServer(serverName);
    const [externalModels, externalNodes] = await Promise.all([this.getExternalModels(server.baseUrl, workflow), this.getExternalNodes(server.baseUrl, workflow)]);
    return externalModels
      .map((x) => ({
        type: ComfyuiDepencencyType.MODEL,
        data: x,
      }))
      .concat(
        externalNodes.map((x) => ({
          type: ComfyuiDepencencyType.NODE,
          data: x,
        })),
      );
  }
}
