import { flatTasks } from '@/common/utils/conductor';
import { TaskType, WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { WorkflowRepository } from '../../database/repositories/workflow.repository';
import { WorkflowRelatedAssetResult } from './interfaces';
import { WorkflowCommonService } from './workflow.common.service';

@Injectable()
export class WorkflowAssetsService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly toolsRepository: ToolsRepository,
    private readonly workflowCommonService: WorkflowCommonService,
  ) {}

  public async getWorkflowRelatedAssets(teamId: string, workflowId: string, version: number): Promise<WorkflowRelatedAssetResult> {
    // 当前流程
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    // 子流程
    const subWorkflows = await this.workflowCommonService.getAllSubWorkflowsRecursive(workflow.tasks);
    let allTasks = workflow.tasks;
    for (const subWorkflow of subWorkflows) {
      allTasks = allTasks.concat(subWorkflow.tasks);
    }
    const flattedTasks: WorkflowTask[] = flatTasks(allTasks);
    const tools = await this.toolsRepository.listTools(teamId);
    const result: WorkflowRelatedAssetResult = {
      sdModels: [],
      llmModels: [],
      textCollections: [],
      tableCollections: [],
      invalidAssetMessages: [],
    };

    for (const task of flattedTasks) {
      if (!task.inputParameters) {
        continue;
      }
      const { type, name: taskName } = task;
      if (type === TaskType.SIMPLE) {
        const tool = tools.find((x) => x.name === taskName);
        if (!tool) {
          continue;
        }
        if (tool.input) {
          for (const inputItem of tool.input) {
            const { name: fieldName, typeOptions } = inputItem;
            const assetType = typeOptions?.assetType;
            if (assetType) {
              switch (assetType) {
                case this.workflowCommonService.ASSET_TYPE_LLM_MODEL:
                  const llmModelId = task.inputParameters[fieldName];
                  if (llmModelId) {
                    try {
                      // const llmModelJson = await this.llmModelService.exportLlmModel(teamId, llmModelId);
                      // result.llmModels.push(llmModelJson);
                    } catch (error) {
                      result.invalidAssetMessages.push(`${tool.displayName} 节点引用了一个不存在的语言模型: ${llmModelId}`);
                    }
                  }
                  break;
                case this.workflowCommonService.ASSET_TYPE_SD_MODEL:
                  const sdModelId = task.inputParameters[fieldName];
                  if (sdModelId) {
                    try {
                      // const sdModelJson = await this.sdModelService.exportSdModel(teamId, sdModelId);
                      // result.sdModels.push(sdModelJson);
                    } catch (error) {
                      result.invalidAssetMessages.push(`${tool.displayName} 节点引用了一个不存在的图像模型: ${sdModelId}`);
                    }
                  }
                  break;
                case this.workflowCommonService.ASSET_TYPE_TABLE_COLLECTION:
                  const tableCollectionId = task.inputParameters[fieldName];
                  if (tableCollectionId) {
                    try {
                      // const tableCollection = await this.tableCollectionService.exportDatabase(tableCollectionId);
                      // result.tableCollections.push(tableCollection);
                    } catch (error) {
                      result.invalidAssetMessages.push(`${tool.displayName} 节点引用了一个不存在的表格数据: ${tableCollectionId}`);
                    }
                  }
                  break;
                case this.workflowCommonService.ASSET_TYPE_TEXT_COLLECTION:
                  const textCollectionName = task.inputParameters[fieldName];
                  if (textCollectionName) {
                    try {
                      // const textCollection = await this.vectorService.exportCollection(textCollectionName);
                      // result.textCollections.push(textCollection);
                    } catch (error) {
                      result.invalidAssetMessages.push(`${tool.displayName} 节点引用了一个不存在的文本数据: ${textCollectionName}`);
                    }
                  }

                  break;
                default:
                  break;
              }
            }
          }
        }
      }
    }

    // 去重
    result.llmModels = _.uniqBy(result.llmModels, (x) => x.originalId);
    result.sdModels = _.uniqBy(result.sdModels, (x) => x.originalId);
    result.tableCollections = _.uniqBy(result.tableCollections, (x) => x.originalId);
    result.textCollections = _.uniqBy(result.textCollections, (x) => x.originalId);

    return result;
  }

  public async getWorkflowRelatedAssetsOfAllVersion(teamId: string, workflowId: string): Promise<WorkflowRelatedAssetResult> {
    const versions = (await this.workflowRepository.getWorkflowVersions(workflowId)).map((x) => x.version);
    const chunks = _.chunk(versions, 10);
    const assets: WorkflowRelatedAssetResult = {
      llmModels: [],
      sdModels: [],
      textCollections: [],
      tableCollections: [],
    };
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (version) => {
          const assetsOfThisVersion = await this.getWorkflowRelatedAssets(teamId, workflowId, version);
          assets.llmModels = assets.llmModels.concat(assetsOfThisVersion.llmModels);
          assets.sdModels = assets.sdModels.concat(assetsOfThisVersion.sdModels);
          assets.textCollections = assets.textCollections.concat(assetsOfThisVersion.textCollections);
          assets.tableCollections = assets.tableCollections.concat(assetsOfThisVersion.tableCollections);
        }),
      );
    }
    // 去重
    assets.llmModels = _.uniqBy(assets.llmModels, (x) => x.originalId);
    assets.sdModels = _.uniqBy(assets.sdModels, (x) => x.originalId);
    assets.tableCollections = _.uniqBy(assets.tableCollections, (x) => x.originalId);
    assets.textCollections = _.uniqBy(assets.textCollections, (x) => x.originalId);
    return assets;
  }
}
