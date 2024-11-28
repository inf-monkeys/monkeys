import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { generateDbId, getComfyuiWorkflowDataListFromWorkflow } from '@/common/utils';
import { flatTasks } from '@/common/utils/conductor';
import { getI18NValue } from '@/common/utils/i18n';
import { extractAssetFromZip } from '@/common/utils/zip-asset';
import { ValidationIssueType, WorkflowMetadataEntity, WorkflowOutputValue, WorkflowRateLimiter, WorkflowValidationIssue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { UpdatePermissionsDto } from '@/modules/workflow/dto/req/update-permissions.dto';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { AssetType, MonkeyTaskDefTypes, ToolProperty, ToolType } from '@inf-monkeys/monkeys';
import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import _, { isEmpty } from 'lodash';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowAutoPinPage } from '../assets/assets.marketplace.data';
import { AssetsPublishService } from '../assets/assets.publish.service';
import { ConductorService } from './conductor/conductor.service';
import { CreateWorkflowData, CreateWorkflowOptions, WorkflowExportJson, WorkflowWithAssetsJson } from './interfaces';
import { WorkflowValidateService } from './workflow.validate.service';

@Injectable()
export class WorkflowCrudService {
  ASSET_TYPE_SD_MODEL: AssetType = 'sd-model';
  ASSET_TYPE_LLM_MODEL: AssetType = 'llm-model';
  ASSET_TYPE_TEXT_COLLECTION: AssetType = 'knowledge-base';
  ASSET_TYPE_TABLE_COLLECTION: AssetType = 'sql-knowledge-base';

  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly conductorService: ConductorService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowValidateService: WorkflowValidateService,
    private readonly assetsCommonRepository: AssetsCommonRepository,
    private readonly assetsPublishService: AssetsPublishService,
  ) {}

  public async getWorkflowDef(workflowId: string, version?: number, simple = true): Promise<WorkflowMetadataEntity> {
    if (!version) {
      version = await this.workflowRepository.getMaxVersion(workflowId);
    }
    let workflow = await this.workflowRepository.getWorkflowById(workflowId, version);

    if (!simple) {
      // 处理快捷方式
      const convertedWorkflow = await this.workflowRepository.convertWorkflowWhitShortcutsFlowId(workflow, version);
      if (convertedWorkflow) {
        workflow = convertedWorkflow;
      } else {
        workflow.shortcutsFlow = null;
      }
    }

    return workflow;
  }

  public async getWorkflowVersions(workflowId: string) {
    return await this.workflowRepository.getWorkflowVersions(workflowId);
  }

  public async listWorkflows(teamId: string, dto: ListDto) {
    const { list, totalCount } = await this.workflowRepository.listWorkflows(teamId, dto);
    return {
      totalCount,
      list: await this.assetsCommonRepository.fillAdditionalInfoList(list, {
        withUser: true,
        withTeam: true,
        withTags: true,
      }),
    };
  }

  public async createWorkflowDef(teamId: string, userId: string, data: CreateWorkflowData, options?: CreateWorkflowOptions) {
    const { assetsPolicy, isTheSameTeam = false, replaceSqlDatabaseMap, replaceVectorDatabaseMap, replaceLlmModelMap, replaceSdModelMap } = options || {};
    const { displayName, iconUrl, description, tasks, variables, triggers, output, version = 1, exposeOpenaiCompatibleInterface = false, shortcutsFlow = null, rateLimiter } = data;
    const workflowId = options?.useExistId || generateDbId();

    // 从应用市场 clone 的时候，资产的授权策略
    const tools = await this.toolsRepository.listTools(teamId);
    if (assetsPolicy && !isTheSameTeam) {
      const flattedTasks: WorkflowTask[] = flatTasks(tasks);
      for (const task of flattedTasks.filter((x) => x.type === ToolType.SIMPLE)) {
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
              // 老版本，跳过
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
      for (const task of flattedTasks.filter((x) => x.type === ToolType.SIMPLE)) {
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

    const validationIssues = await this.workflowValidateService.validateWorkflow(teamId, tasks || [], output || []);
    const errors = validationIssues.filter((i) => i.issueType === ValidationIssueType.ERROR);
    const validated = errors.length === 0;
    const workflowEntity = await this.workflowRepository.createWorkflow(
      teamId,
      userId,
      workflowId,
      version,
      {
        displayName,
        description,
        iconUrl,
        tasks,
        output,
        variables,
        exposeOpenaiCompatibleInterface,
        rateLimiter,
        validationIssues,
        validated,
        shortcutsFlow,
      },
      options?.useNewId ?? false,
    );
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

    let newWorkflowId: string;
    try {
      // 导入表格数据
      const replaceSqlDatabaseMap = {};
      logger.log('开始导入表格数据集：', tableCollections.length);
      for (const infoJson of tableCollections) {
        try {
          // const sqlDatabaseId = await this.tableCollectionService.importDatabase(teamId, userId, infoJson);
          // replaceSqlDatabaseMap[infoJson.originalId] = sqlDatabaseId;
        } catch (error) {
          logger.error('导入表格数据失败：', infoJson, error);
        }
      }

      // 导入向量数据库
      logger.log('开始导入文本数据集：', textCollections.length);
      const replaceVectorDatabaseMap = {};
      if (textCollections.length) {
        for (const infoJson of textCollections) {
          try {
            // const collectionName = await this.vectorService.importCollection(teamId, userId, infoJson);
            // replaceVectorDatabaseMap[infoJson.originalId] = collectionName;
          } catch (error) {
            logger.error('导入文本数据失败：', infoJson, error);
          }
        }
      }

      // 导入 llm model
      const replaceLlmModelMap = {};
      logger.log('开始导入文本模型：', llmModels.length);
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
              logger.error('导入文本模型失败：', c, error);
            }
          }),
        );
      }

      // 导入 sd model
      logger.log('开始导入图像模型：', sdModels.length);
      const replaceSdModelMap = {};
      const sdModelsChunks = _.chunk(sdModels, 10);
      for (const chunk of sdModelsChunks) {
        await Promise.all(
          chunk.map(async (c) => {
            try {
              // const newSdModel = await this.sdModelAssetSvc.createAsset('sd-model', c, { teamId, userId });
              // replaceSdModelMap[c.originalId] = newSdModel._id.toHexString();
            } catch (error) {
              logger.error('导入图像模型失败：', c, error);
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
            logger.error(`Error: ${error.message}`);
          } else {
            logger.info(`Folder ${tmpFolder} deleted successfully!`);
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
    return await this.workflowRepository.deleteWorkflow(teamId, workflowId);
  }

  public async cloneWorkflowOfVersion(teamId: string, userId: string, originalWorkflowId: string, originalWorkflowVersion: number) {
    const originalWorkflow = await this.workflowRepository.getWorkflowById(originalWorkflowId, originalWorkflowVersion);
    return await this.createWorkflowDef(teamId, userId, {
      displayName: {
        'zh-CN': getI18NValue(originalWorkflow.displayName, 'zh-CN') + ' - 副本',
        'en-US': getI18NValue(originalWorkflow.displayName, 'en-US') + ' - Copy',
      },
      version: originalWorkflowVersion,
      tasks: originalWorkflow.tasks,
    });
  }

  public async cloneWorkflow(teamId: string, userId: string, originalWorkflowId: string, autoPinPage?: WorkflowAutoPinPage) {
    const versions = await this.workflowRepository.getWorkflowVersions(originalWorkflowId);
    const newWorkflowId = generateDbId();
    for (const { version } of versions) {
      const originalWorkflow = await this.workflowRepository.getWorkflowById(originalWorkflowId, version);
      const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow(originalWorkflow.tasks);
      const comfyuiWorkflowIds = Array.from(new Set(comfyuiDataList.map((c) => c.comfyuiWorkflowId)));
      const comfyuiWorkflowIdMapper = comfyuiWorkflowIds.reduce((mapper, comfyuiWorkflowId) => {
        mapper[comfyuiWorkflowId] = null;
        return mapper;
      }, {});
      for (const comfyuiWorkflowId of comfyuiWorkflowIds) {
        const { id } = await this.assetsPublishService.forkAsset('comfyui-workflow', teamId, comfyuiWorkflowId);
        comfyuiWorkflowIdMapper[comfyuiWorkflowId] = id;
      }
      if (comfyuiDataList.length > 0) {
        for (const { path, comfyuiWorkflowId } of comfyuiDataList) {
          logger.debug(`${path}.workflow`);
          _.set(originalWorkflow.tasks, `${path}.workflow`, comfyuiWorkflowIdMapper[comfyuiWorkflowId]);
        }
      }
      await this.createWorkflowDef(
        teamId,
        userId,
        {
          displayName: {
            'zh-CN': getI18NValue(originalWorkflow.displayName, 'zh-CN') + ' - 副本',
            'en-US': getI18NValue(originalWorkflow.displayName, 'en-US') + ' - Copy',
          },
          version: version,
          tasks: originalWorkflow.tasks,
          iconUrl: originalWorkflow.iconUrl,
          description: originalWorkflow.description,
          variables: originalWorkflow.variables,
          output: originalWorkflow.output,
          exposeOpenaiCompatibleInterface: originalWorkflow.exposeOpenaiCompatibleInterface,
          rateLimiter: originalWorkflow.rateLimiter,
          shortcutsFlow: originalWorkflow.shortcutsFlow,
        },
        {
          useExistId: newWorkflowId,
        },
      );
    }

    if (autoPinPage) {
      await this.autoPinnedPageWithWorkflowId(teamId, newWorkflowId, autoPinPage);
    }

    return newWorkflowId;
  }

  private async autoPinnedPageWithWorkflowId(teamId: string, workflowId: string, autoPinPage: WorkflowAutoPinPage) {
    const pages = await this.workflowRepository.listWorkflowPagesAndCreateIfNotExists(workflowId);

    const groupMap: Record<string, WorkflowPageGroupEntity> = {};
    const groups = _.uniq(autoPinPage.flatMap((it) => Object.keys(it)));
    const groupIds = await this.workflowRepository.getPageGroupsAndCreateIfNotExists(teamId, groups);
    let groupIndex = 0;
    for (const group of groupIds) {
      groupMap[groups[groupIndex]] = group;
      groupIndex++;
    }

    for (const mapper of autoPinPage) {
      for (const [groupName, pageTypes] of Object.entries(mapper)) {
        const type2PageIds = pages.filter((it) => pageTypes.includes(it.type)).map((it) => it.id);
        groupMap[groupName].pageIds = _.uniq([...(groupMap[groupName].pageIds ?? []), ...type2PageIds]);
      }
    }

    for (const group of Object.values(groupMap)) {
      await this.workflowRepository.updatePageGroup(group.id, { pageIds: group.pageIds });
    }
  }

  private convertWorkflowToJson(workflow: WorkflowMetadataEntity, triggers?: WorkflowTriggersEntity[]): WorkflowExportJson {
    return {
      displayName: workflow.displayName,
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
  }

  public async exportWorkflowOfVersion(workflowId: string, version: number) {
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
    const versions = await this.workflowRepository.getWorkflowVersions(workflowId);
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
      displayName?: string;
      description?: string;
      iconUrl?: string;
      tasks?: MonkeyTaskDefTypes[];
      variables?: ToolProperty[];
      validationIssues?: WorkflowValidationIssue[];
      output?: WorkflowOutputValue[];
      exposeOpenaiCompatibleInterface?: boolean;
      rateLimiter?: WorkflowRateLimiter;
      openaiModelName?: string;
      shortcutsFlow?: string;
    },
  ) {
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！`);
    }

    // 当为快捷方式时，只允许更新 shortcutsFlow 字段
    if (!isEmpty(workflow?.shortcutsFlow ?? null)) {
      updates = {
        shortcutsFlow: updates.shortcutsFlow,
      };
    }

    const workflowEntity = await this.workflowRepository.updateWorkflowDef(teamId, workflowId, version, updates);
    let validated = workflow.validated;
    let validationIssues: WorkflowValidationIssue[] = [];
    if (updates.tasks || updates.output) {
      validationIssues = await this.workflowValidateService.validateWorkflow(teamId, updates.tasks || workflow.tasks, updates.output || workflow.output || []);
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

  public async setWorkflowPermissions(teamId: string, workflowId: string, permissions: UpdatePermissionsDto) {
    if ('notAuthorized' in permissions) {
      return !!(await this.workflowRepository.toggleWorkflowUnauthorized(teamId, workflowId, permissions.notAuthorized));
    }

    return false;
  }

  public async getWorkflowPermissions(workflowId: string) {
    return {
      notAuthorized: (await this.workflowRepository.hasWorkflowUnauthorized(workflowId))?.notAuthorized || false,
    };
  }

  public async workflowCanUse(workflowId: string, version?: number) {
    if (!version) {
      version = await this.workflowRepository.getMaxVersion(workflowId);
    }

    try {
      const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
      if (!workflow) {
        return false;
      }

      if (!isEmpty(workflow?.shortcutsFlow ?? null)) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  public async createShortcut(workflowId: string, teamId: string, userId: string) {
    const targetWorkflowVersion = await this.workflowRepository.getMaxVersion(workflowId);
    const targetWorkflow = await this.workflowRepository.getWorkflowById(workflowId, targetWorkflowVersion, false);

    if (!isEmpty(targetWorkflow?.shortcutsFlow ?? null)) {
      throw new NotFoundException(`工作流 (${workflowId}) 已经是快捷方式！`);
    }

    if (targetWorkflow) {
      const exposeOpenaiCompatibleInterface = targetWorkflow.exposeOpenaiCompatibleInterface;
      const newWorkflowId = await this.createWorkflowDef(teamId, userId, {
        displayName: targetWorkflow.displayName,
        description: targetWorkflow.description,
        iconUrl: targetWorkflow.iconUrl,
        tasks: targetWorkflow.tasks,
        variables: targetWorkflow.variables,
        output: targetWorkflow.output,
        exposeOpenaiCompatibleInterface: exposeOpenaiCompatibleInterface,
        shortcutsFlow: `${workflowId}:${targetWorkflowVersion}`,
      });

      // 处理工作空间页面
      await this.autoPinnedPageWithWorkflowId(teamId, newWorkflowId, [
        {
          default: [exposeOpenaiCompatibleInterface ? 'chat' : 'preview'],
        },
      ]);

      return targetWorkflow;
    } else {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！无法创建快捷方式`);
    }
  }
}
