import { config } from '@/common/config';
import { flatTasks } from '@/common/utils/conductor';
import { extractAssetFromZip } from '@/common/utils/zip-asset';
import { ValidationIssueType, WorkflowMetadataEntity, WorkflowOutputValue, WorkflowValidationIssue } from '@/entities/workflow/workflow-metadata';
import { WorkflowTriggersEntity } from '@/entities/workflow/workflow-trigger';
import { AssetType, BlockDefProperties, BlockType, MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { WorkflowTask } from '@io-orkes/conductor-javascript';
import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { ToolsRepository } from '../../repositories/tools.repository';
import { WorkflowRepository } from '../../repositories/workflow.repository';
import { ConductorService } from './conductor/conductor.service';
import { CreateWorkflowData, CreateWorkflowOptions, WorkflowExportJson, WorkflowWithAssetsJson } from './interfaces';
import { WorkflowValidateService } from './workflow.validate.service';

@Injectable()
export class WorkflowCrudService {
  ASSET_TYPE_SD_MODEL: AssetType = 'sd-model';
  ASSET_TYPE_LLM_MODEL: AssetType = 'llm-model';
  ASSET_TYPE_TEXT_COLLECTION: AssetType = 'text-collection';
  ASSET_TYPE_TABLE_COLLECTION: AssetType = 'table-collection';

  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly conductorService: ConductorService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowValidateService: WorkflowValidateService,
  ) {}

  public async getRecentlyUsedWorkflows() {}

  public async createWorkflowDef(teamId: string, userId: string, data: CreateWorkflowData, options?: CreateWorkflowOptions) {
    const { assetsPolicy, isTheSameTeam = false, replaceSqlDatabaseMap, replaceVectorDatabaseMap, replaceLlmModelMap, replaceSdModelMap } = options || {};
    const { name, iconUrl, description, tasks, variables, triggers, output, version = 1 } = data;
    const workflowId = options?.useExistId || new ObjectId().toHexString();

    // 从应用市场 clone 的时候，资产的授权策略
    const tools = await this.toolsRepository.listTools();
    if (assetsPolicy && !isTheSameTeam) {
      const flattedTasks: WorkflowTask[] = flatTasks(tasks);
      for (const task of flattedTasks.filter((x) => x.type === BlockType.SIMPLE)) {
        const block = tools.find((x) => x.name === task.name);
        if (block?.input?.length) {
          for (const inputItem of block.input) {
            const { name: fieldName, typeOptions } = inputItem;
            const assetId = task.inputParameters[fieldName];
            const assetType = typeOptions?.assetType;
            if (assetType) {
              const policyConfig = assetsPolicy[assetId];
              if (!policyConfig) {
                continue;
              }
              // 老版本，调过
              if (typeof policyConfig === 'string') {
                continue;
              }
              const { value: policyName, assetType: policyAssetType } = policyConfig;
              if (assetType !== policyAssetType) {
                continue;
              }
              switch (assetType) {
                case this.ASSET_TYPE_TABLE_COLLECTION:
                  // TODO: 检查 db 是否存在
                  const databaseId = task.inputParameters[fieldName];
                  if (!databaseId) {
                    continue;
                  }
                  if (policyName === 'authorize') {
                    // TODO
                    // await this.tableCollectionService.authorizeDatabase(databaseId, userId, teamId);
                  } else if (policyName === 'clone') {
                    // TODO
                    // const newDb = await this.tableCollectionService.cloneDatabase(databaseId, userId, teamId);
                    // task.inputParameters[fieldName] = newDb._id.toHexString();
                  }
                  break;
                case this.ASSET_TYPE_TEXT_COLLECTION:
                  // TODO: 检查 db 是否存在
                  const collectionName = task.inputParameters[fieldName];
                  if (!collectionName) {
                    continue;
                  }
                  if (policyName === 'authorize') {
                    // TODO
                    // await this.milvusGatewayService.authorizeCollection(collectionName, teamId);
                  } else if (policyName === 'createNew') {
                    if (collectionName) {
                      // TODO
                      // const newCollectionName = await this.milvusGatewayService.copyCollectionWithOutData(collectionName, teamId, userId);
                      // task.inputParameters[fieldName] = newCollectionName;
                    }
                  }
                  break;
                case this.ASSET_TYPE_SD_MODEL:
                  const modelId = task.inputParameters[fieldName];
                  if (!modelId) {
                    continue;
                  }
                  if (policyName === 'authorize') {
                    // TODO
                    // const isBuiltInModel = await this.sdModelService.isBuiltInModel(modelId);
                    // 非内置模型，将模型授权
                    // if (!isBuiltInModel) {
                    //   logger.info(`将图像模型 ${modelId} 授权给 userId=${userId}, teamId=${teamId}`);
                    //   await this.sdModelService.authorizeModel(modelId, userId, teamId);
                    // }
                    // // prompt 中包含 lora 模型，也需要授权
                    // const prompt = task.inputParameters['prompt'];
                    // if (prompt) {
                    //   const loraModelId = this.getLoraModelIdFromPrompt(prompt);
                    //   if (loraModelId) {
                    //     logger.info(`将 lora 图像模型 ${loraModelId} 授权给 userId=${userId}, teamId=${teamId}`);
                    //     await this.sdModelService.authorizeModel(loraModelId, userId, teamId);
                    //   }
                    // }
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

    // 导入工作流的时候替换想了数据库和表格数据
    if (replaceSqlDatabaseMap || replaceVectorDatabaseMap || replaceSdModelMap || replaceLlmModelMap) {
      const flattedTasks: WorkflowTask[] = flatTasks(tasks);
      for (const task of flattedTasks.filter((x) => x.type === BlockType.SIMPLE)) {
        const tool = tools.find((x) => x.name === task.name);
        if (tool?.input?.length) {
          for (const inputItem of tool.input) {
            const { name: fieldName, typeOptions } = inputItem;
            const assetType = typeOptions?.assetType;
            if (assetType) {
              const originalValue = task.inputParameters[fieldName];
              switch (assetType) {
                // 替换 sql 数据库
                case this.ASSET_TYPE_TABLE_COLLECTION:
                  if (replaceSqlDatabaseMap && replaceSqlDatabaseMap[originalValue]) {
                    task.inputParameters[fieldName] = replaceSqlDatabaseMap[originalValue];
                  }
                  break;
                // 替换向量数据库
                case this.ASSET_TYPE_TEXT_COLLECTION:
                  if (replaceVectorDatabaseMap && replaceVectorDatabaseMap[originalValue]) {
                    task.inputParameters[fieldName] = replaceVectorDatabaseMap[originalValue];
                  }
                  break;
                // 替换文本模型
                case this.ASSET_TYPE_LLM_MODEL:
                  if (replaceLlmModelMap && replaceLlmModelMap[originalValue]) {
                    task.inputParameters[fieldName] = replaceLlmModelMap[originalValue];
                  }
                  break;
                // 替换图像模型
                case this.ASSET_TYPE_SD_MODEL:
                  if (replaceSdModelMap && replaceSdModelMap[originalValue]) {
                    task.inputParameters[fieldName] = replaceSdModelMap[originalValue];
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

    // 处理密钥
    const flattedTasks: WorkflowTask[] = flatTasks(tasks);
    for (const task of flattedTasks) {
      if (task.inputParameters) {
        const { credential } = task.inputParameters;
        if (credential) {
          // TODO
          // const { id } = credential;
          // const canUse = await this.credentialService.isCredentialBelongToTeam(teamId, id);
          // if (!canUse) {
          //   delete task.inputParameters.credential;
          // }
        }
      }
    }

    const workflowEntity = await this.workflowRepository.createWorkflow(teamId, userId, workflowId, version, {
      name,
      description,
      iconUrl,
      tasks,
      output,
      variables,
    });
    await this.conductorService.saveWorkflowInConductor(workflowEntity);

    // const chain = await this.getSubWorkflowChain(masterWorkflowId, 1);
    // if (chain.length > 1) {
    //   await this.convertNestedDoWhileVinesTasksToConductorTasks(teamId, chain);
    // }

    if (triggers?.length) {
      for (const trigger of triggers) {
        await this.workflowRepository.createWorkflowTrigger({
          workflowId: workflowId,
          type: trigger.type,
          cron: trigger.cron,
          enabled: trigger.enabled,
          workflowVersion: 1,
          webhookConfig: trigger.webhookConfig,
        });
      }
    }

    return workflowId;
  }

  public async importWorkflowByZip(teamId: string, userId: string, zipUrl: string) {
    const { tmpFolder, workflows, llmModels, sdModels, textCollections, tableCollections } = await extractAssetFromZip(zipUrl);
    if (workflows?.length !== 1) {
      throw new Error('不合法的 zip 文件, zip 文件中必须有且只有一条工作流');
    }

    let newWorkflowId;
    try {
      // 导入表格数据
      const replaceSqlDatabaseMap = {};
      console.log('开始导入表格数据集：', tableCollections.length);
      for (const infoJson of tableCollections) {
        try {
          // const sqlDatabaseId = await this.tableCollectionService.importDatabase(teamId, userId, infoJson);
          // replaceSqlDatabaseMap[infoJson.originalId] = sqlDatabaseId;
        } catch (error) {
          console.error('导入表格数据失败：', infoJson, error);
        }
      }

      // 导入向量数据库
      console.log('开始导入文本数据集：', textCollections.length);
      const replaceVectorDatabaseMap = {};
      if (textCollections.length) {
        for (const infoJson of textCollections) {
          try {
            // const collectionName = await this.vectorService.importCollection(teamId, userId, infoJson);
            // replaceVectorDatabaseMap[infoJson.originalId] = collectionName;
          } catch (error) {
            console.error('导入文本数据失败：', infoJson, error);
          }
        }
      }

      // 导入 llm model
      const replaceLlmModelMap = {};
      console.log('开始导入文本模型：', llmModels.length);
      const llmModelsChunks = _.chunk(llmModels, 10);
      for (const chunk of llmModelsChunks) {
        await Promise.all(
          chunk.map(async (c) => {
            try {
              // const newLlmModel = await this.llmModelAssetSvc.createAsset('llm-model', c, {
              //   teamId,
              //   userId,
              // });
              // replaceLlmModelMap[c.originalId] = newLlmModel._id.toHexString();
            } catch (error) {
              console.error('导入文本模型失败：', c, error);
            }
          }),
        );
      }

      // 导入 sd model
      console.log('开始导入图像模型：', sdModels.length);
      const replaceSdModelMap = {};
      const sdModelsChunks = _.chunk(sdModels, 10);
      for (const chunk of sdModelsChunks) {
        await Promise.all(
          chunk.map(async (c) => {
            try {
              // const newSdModel = await this.sdModelAssetSvc.createAsset('sd-model', c, { teamId, userId });
              // replaceSdModelMap[c.originalId] = newSdModel._id.toHexString();
            } catch (error) {
              console.error('导入图像模型失败：', c, error);
            }
          }),
        );
      }

      // 导入工作流
      newWorkflowId = await this.createWorkflowDef(teamId, userId, workflows[0].workflows[0], {
        replaceSqlDatabaseMap,
        replaceVectorDatabaseMap,
        replaceLlmModelMap,
        replaceSdModelMap,
      });
    } catch (error) {
      throw new Error(`导入工作流失败: ${error.message}`);
    } finally {
      fs.rm(
        tmpFolder,
        {
          recursive: true,
          force: true,
        },
        (error) => {
          if (error) {
            console.error(`Error: ${error.message}`);
          } else {
            console.log(`Folder ${tmpFolder} deleted successfully!`);
          }
        },
      );
    }

    // 再查询一遍总共导入的资产
    // const assets = await this.service.getWorkflowRelatedAssetsOfAllVersion(newWorkflowId);
    return {
      newWorkflowId,
      // assets,
    };
  }

  /**
   * 删除 workflow（conductor 里面的 workflow 定义不要删，保留一下备份，不然日志那些都查不到了）
   */
  public async deleteWorkflowDef(teamId: string, workflowId: string) {
    const result = await this.workflowRepository.deleteWorkflow(teamId, workflowId);
    return result;
  }

  public async cloneWorkflowOfVersion(teamId: string, userId: string, originalWorkflowId: string, originalWorkflowVersion: number) {
    const originalWorkflow = await this.workflowRepository.getWorkflowById(originalWorkflowId, originalWorkflowVersion);
    const workflowId = await this.createWorkflowDef(teamId, userId, {
      name: originalWorkflow.name + ' - 副本',
      version: originalWorkflowVersion,
      tasks: originalWorkflow.tasks,
    });
    return workflowId;
  }

  public async cloneWorkflow(teamId: string, userId: string, originalWorkflowId: string) {
    const versions = await this.workflowRepository.getWorklfowVersions(originalWorkflowId);
    const newWorkflowId = new ObjectId().toHexString();
    for (const { version } of versions) {
      const originalWorkflow = await this.workflowRepository.getWorkflowById(originalWorkflowId, version);
      await this.createWorkflowDef(
        teamId,
        userId,
        {
          name: originalWorkflow.name + ' - 副本',
          version: version,
          tasks: originalWorkflow.tasks,
        },
        {
          useExistId: newWorkflowId,
        },
      );
    }
    return newWorkflowId;
  }

  private convertWorkflowToJson(workflow: WorkflowMetadataEntity, triggers?: WorkflowTriggersEntity[]): WorkflowExportJson {
    const json: WorkflowExportJson = {
      name: workflow.name,
      iconUrl: workflow.iconUrl,
      description: workflow.description,
      version: workflow.version,
      tasks: workflow.tasks,
      triggers: triggers?.map((trigger) => ({
        type: trigger.type,
        cron: trigger.cron,
        enabled: trigger.enabled,
        webhookConfig: trigger.webhookConfig,
      })),
      variables: workflow.variables,
      output: workflow.output,
      originalId: workflow.workflowId,
      originalSite: config.server.appId,
      assetType: 'workflow',
    };
    return json;
  }

  private async exportWorkflowOfVersion(workflowId: string, version: number) {
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    const triggers = await this.workflowRepository.listWorkflowTriggers(workflowId, version);
    const json: WorkflowExportJson = this.convertWorkflowToJson(workflow, triggers);
    return {
      workflow: json,
    };
  }

  /**
   * 导出工作流
   */
  public async exportWorkflow(workflowId: string): Promise<WorkflowWithAssetsJson> {
    const versions = await this.workflowRepository.getWorklfowVersions(workflowId);
    versions.sort((a, b) => b.version - a.version);
    const workflows = [];
    for (const version of versions) {
      const { workflow } = await this.exportWorkflowOfVersion(workflowId, version.version);
      workflows.push(workflow);
    }
    // const pages = await this.pageService.listWorkflowPagesBrief(workflowId, teamId, userId);
    return {
      workflows: workflows,
      pages: [],
    };
  }

  public async updateWorkflowDef(
    teamId: string,
    workflowId: string,
    version: number,
    updates: {
      name?: string;
      description?: string;
      iconUrl?: string;
      tasks?: MonkeyTaskDefTypes[];
      variables?: BlockDefProperties[];
      validationIssues?: WorkflowValidationIssue[];
      output?: WorkflowOutputValue[];
    },
  ) {
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！`);
    }
    const workflowEntity = await this.workflowRepository.updateWorkflowDef(teamId, workflowId, version, updates);
    let validated = workflow.validated;
    let validationIssues: WorkflowValidationIssue[] = [];
    if (updates.tasks || updates.output) {
      validationIssues = await this.workflowValidateService.validateWorkflow(updates.tasks, updates.output || workflow.output || []);
      const errors = validationIssues.filter((i) => i.issueType === ValidationIssueType.ERROR);
      validated = errors.length === 0;
      await this.workflowRepository.updateWorkflowDef(teamId, workflowId, version, {
        validationIssues,
        validated,
      });
      await this.conductorService.saveWorkflowInConductor(workflowEntity);
    }

    return {
      validated,
      validationIssues,
    };
  }
}
