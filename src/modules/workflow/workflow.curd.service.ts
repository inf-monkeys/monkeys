import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { generateDbId, getComfyuiWorkflowDataListFromWorkflow, getSubWorkflowDataList, removeCredentials } from '@/common/utils';
import { flatTasks } from '@/common/utils/conductor';
import { getI18NValue } from '@/common/utils/i18n';
import { extractAssetFromZip } from '@/common/utils/zip-asset';
import { ValidationIssueType, WorkflowMetadataEntity, WorkflowOutputValue, WorkflowRateLimiter, WorkflowValidationIssue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { UpdatePermissionsDto } from '@/modules/workflow/dto/req/update-permissions.dto';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { AssetType, I18nValue, MonkeyTaskDefTypes, ToolProperty, ToolType } from '@inf-monkeys/monkeys';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import _, { isEmpty } from 'lodash';
import { WorkflowAutoPinPage } from '../assets/assets.marketplace.data';
import { AssetsPermissionService } from '../assets/assets.permission.service';
import { AssetsPublishService } from '../assets/assets.publish.service';
import { MarketplaceService } from '../marketplace/services/marketplace.service';
import { AssetCloneResult, AssetUpdateResult, IAssetHandler } from '../marketplace/types';
import { ConductorService } from './conductor/conductor.service';
import { CreateWorkflowData, CreateWorkflowOptions, WorkflowExportJson, WorkflowPageJson, WorkflowPageUpdateJson, WorkflowWithAssetsJson } from './interfaces';
import { WorkflowPageService } from './workflow.page.service';
import { WorkflowValidateService } from './workflow.validate.service';

@Injectable()
export class WorkflowCrudService implements IAssetHandler {
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
    private readonly pageService: WorkflowPageService,

    @Inject(forwardRef(() => AssetsPublishService))
    private readonly assetsPublishService: AssetsPublishService,

    @Inject(forwardRef(() => MarketplaceService))
    private readonly marketplaceService: MarketplaceService,

    @Inject(forwardRef(() => AssetsPermissionService))
    private readonly assetsPermissionService: AssetsPermissionService,
  ) {}

  public async getSnapshot(workflowIdOrRecordId: string, version: number): Promise<any> {
    let workflow: WorkflowExportJson | undefined;
    try {
      workflow = (await this.exportWorkflowOfVersion(workflowIdOrRecordId, version)).workflow;
    } catch (error) {
      workflow = (await this.exportWorkflowByRecordId(workflowIdOrRecordId)).workflow;
    }

    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowIdOrRecordId}) 不存在！`);
    }

    const pages = await this.pageService.listWorkflowPagesBrief(workflow.originalId);

    const tasks = workflow.tasks;

    removeCredentials(tasks);

    // 子工作流
    const subWorkflows = getSubWorkflowDataList(tasks);
    for (const subWorkflow of subWorkflows) {
      const appVersion = await this.marketplaceService.getAppVersionByAssetId(subWorkflow.subWorkflowId, 'workflow');
      if (!appVersion) {
        throw new NotFoundException(`找不到子工作流 ${subWorkflow.subWorkflowId} 对应的应用市场应用`);
      }
      _.set(workflow, `tasks.${subWorkflow.path}`, appVersion.appId);
    }

    // comfyui
    const comfyuiWorkflows = getComfyuiWorkflowDataListFromWorkflow(tasks);
    for (const comfyuiWorkflow of comfyuiWorkflows) {
      const appVersion = await this.marketplaceService.getAppVersionByAssetId(comfyuiWorkflow.comfyuiWorkflowId, 'comfyui-workflow');
      if (!appVersion) {
        throw new NotFoundException(`找不到 comfyui 工作流 ${comfyuiWorkflow.comfyuiWorkflowId} 对应的应用市场应用`);
      }
      _.set(workflow, `tasks.${comfyuiWorkflow.path}.workflow`, appVersion.appId);

      // server
      _.set(workflow, `tasks.${comfyuiWorkflow.path}.server`, 'system');
    }

    return { workflow, pages };
  }

  private async processWorkflowSnapshot(snapshot: WorkflowExportJson, teamId: string): Promise<WorkflowExportJson> {
    const clonedSnapshot = _.cloneDeep(snapshot);

    const tasks = clonedSnapshot.tasks;

    // 子工作流
    const subWorkflows = getSubWorkflowDataList(tasks);
    for (const { subWorkflowId: subWorkflowAppId, path } of subWorkflows) {
      const subWorkflow = await this.marketplaceService.getAppDetails(subWorkflowAppId);
      if (subWorkflow) {
        const latestVersion = subWorkflow.versions.sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];
        const installedApp = await this.marketplaceService.getInstalledAppByAppVersionId(latestVersion.id, teamId);
        if (installedApp?.installedAssetIds?.workflow?.[0]) {
          _.set(clonedSnapshot, `tasks.${path}`, installedApp.installedAssetIds.workflow[0]);
        } else {
          throw new NotFoundException(`子工作流应用 ${subWorkflowAppId} 未安装`);
        }
      } else {
        throw new NotFoundException(`子工作流应用 ${subWorkflowAppId} 未安装`);
      }
    }

    // comfyui
    const comfyuiWorkflows = getComfyuiWorkflowDataListFromWorkflow(tasks);
    for (const { comfyuiWorkflowId: comfyuiWorkflowAppId, path } of comfyuiWorkflows) {
      const comfyuiWorkflow = await this.marketplaceService.getAppDetails(comfyuiWorkflowAppId);
      if (comfyuiWorkflow) {
        const latestVersion = comfyuiWorkflow.versions.sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];
        const installedApp = await this.marketplaceService.getInstalledAppByAppVersionId(latestVersion.id, teamId);
        if (installedApp?.installedAssetIds?.['comfyui-workflow']?.[0]) {
          _.set(clonedSnapshot, `tasks.${path}.workflow`, installedApp?.installedAssetIds?.['comfyui-workflow']?.[0]);
        } else {
          throw new NotFoundException(`comfyui 工作流应用 ${comfyuiWorkflowAppId} 未安装`);
        }
      } else {
        throw new NotFoundException(`comfyui 工作流应用 ${comfyuiWorkflowAppId} 未安装`);
      }
    }

    return clonedSnapshot;
  }

  /**
   * 清理workflow中缺失的资产引用
   * 如果引用的资产不存在，设置为null并记录警告
   */
  private async cleanMissingAssetReferences(
    workflow: WorkflowExportJson,
    _teamId: string,
    exportedAssets: {
      llmModels?: any[];
      sdModels?: any[];
      tableCollections?: any[];
      textCollections?: any[];
    },
  ): Promise<{ workflow: WorkflowExportJson; assetWarnings: string[] }> {
    const warnings: string[] = [];
    const clonedWorkflow = _.cloneDeep(workflow);

    // 遍历所有task，检查资产引用
    for (let i = 0; i < clonedWorkflow.tasks.length; i++) {
      const task = clonedWorkflow.tasks[i];
      const taskAny = task as { name?: string; inputParameters?: Record<string, any> };

      if (!taskAny.inputParameters || typeof taskAny.inputParameters !== 'object') {
        continue;
      }

      const inputParams = taskAny.inputParameters;

      // 检查 LLM 模型引用
      if (inputParams.model) {
        const modelId = inputParams.model;
        // 检查是否在导出的资产中
        const modelExists = exportedAssets.llmModels?.some((m) => m.originalId === modelId);

        if (!modelExists) {
          warnings.push(`Task "${task.name}" (第${i + 1}个): LLM模型 "${modelId}" 未找到，已清空。请在导入后手动配置。`);
          taskAny.inputParameters.model = null;
        }
      }

      // 检查 SD 模型引用
      if (inputParams.sdModel) {
        const modelId = inputParams.sdModel;
        const modelExists = exportedAssets.sdModels?.some((m) => m.originalId === modelId);

        if (!modelExists) {
          warnings.push(`Task "${task.name}" (第${i + 1}个): SD模型 "${modelId}" 未找到，已清空。请在导入后手动配置。`);
          taskAny.inputParameters.sdModel = null;
        }
      }

      // 检查数据库引用
      if (inputParams.database) {
        const dbId = inputParams.database;
        const dbExists = exportedAssets.tableCollections?.some((db) => db.originalId === dbId);

        if (!dbExists) {
          warnings.push(`Task "${task.name}" (第${i + 1}个): 数据库 "${dbId}" 未找到，已清空。请在导入后手动配置。`);
          taskAny.inputParameters.database = null;
        }
      }

      // 检查向量数据库引用
      if (inputParams.collectionName) {
        const collectionName = inputParams.collectionName;
        const collectionExists = exportedAssets.textCollections?.some((c) => c.name === collectionName);

        if (!collectionExists) {
          warnings.push(`Task "${task.name}" (第${i + 1}个): 向量数据库 "${collectionName}" 未找到，已清空。请在导入后手动配置。`);
          taskAny.inputParameters.collectionName = null;
        }
      }
    }

    return {
      workflow: clonedWorkflow,
      assetWarnings: warnings,
    };
  }

  public async cloneFromSnapshot(snapshot: any, teamId: string, userId: string): Promise<AssetCloneResult & { pages: WorkflowPageEntity[] }> {
    const { workflow, pages } = snapshot;
    const originalId = workflow.originalId;

    const processedWorkflow = await this.processWorkflowSnapshot(workflow, teamId);

    const { id: newWorkflowId, pages: resultPages } = await this.importWorkflow(teamId, userId, {
      workflows: [processedWorkflow],
      pages,
    });
    return { originalId, newId: newWorkflowId, pages: resultPages };
  }

  public async updateFromSnapshot(snapshot: any, teamId: string, userId: string, workflowId: string): Promise<AssetUpdateResult> {
    const { workflow, pages } = snapshot;
    const processedWorkflow = await this.processWorkflowSnapshot(workflow, teamId);
    await this.updateWorkflow(teamId, userId, workflowId, { workflows: [processedWorkflow], pages });
    return { originalId: workflowId };
  }

  private async importWorkflow(teamId: string, userId: string, data: { workflows: WorkflowExportJson[]; pages: WorkflowPageJson[] }): Promise<{ id: string; pages: WorkflowPageEntity[] }> {
    const workflowData = data.workflows[0];
    const newWorkflowId = await this.createWorkflowDef(teamId, userId, workflowData);
    const pages = await this.pageService.importWorkflowPage(newWorkflowId, teamId, data.pages);
    return {
      id: newWorkflowId,
      pages,
    };
  }

  private async updateWorkflow(teamId: string, userId: string, workflowId: string, data: { workflows: WorkflowExportJson[]; pages: WorkflowPageUpdateJson[] }): Promise<AssetUpdateResult> {
    const workflowData = data.workflows[0];
    await this.updateWorkflowDef(teamId, workflowId, workflowData.version, {
      displayName: workflowData.displayName,
      description: workflowData.description,
      iconUrl: workflowData.iconUrl,
      tasks: workflowData.tasks,
      variables: workflowData.variables,
    });
    await this.pageService.updateWorkflowPage(workflowId, data.pages);
    return { originalId: workflowId };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async remapDependencies(newWorkflowId: string, idMapping: { [originalId: string]: string }): Promise<void> {
    return;
  }

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

  public async getWorkflowDefByRecordId(recordId: string): Promise<WorkflowMetadataEntity> {
    return await this.workflowRepository.getWorkflowByRecordId(recordId);
  }

  public async getWorkflowVersions(workflowId: string) {
    return await this.workflowRepository.getWorkflowVersions(workflowId);
  }

  public async listWorkflows(teamId: string, dto: ListDto) {
    const { list, totalCount } = await this.workflowRepository.listWorkflows(teamId, dto);

    // 先补充 user / team / tags 信息
    const filledList = await this.assetsCommonRepository.fillAdditionalInfoList(list, {
      withUser: true,
      withTeam: true,
      withTags: true,
    });

    // 为每个 workflow 计算是否为内置应用（对应应用 isPreset = true）
    const builtinMap: Record<string, boolean> = {};
    await Promise.all(
      list.map(async (wf) => {
        try {
          const appVersion = await this.marketplaceService.getAppVersionByAssetId(wf.workflowId, 'workflow');
          if (appVersion?.app) {
            builtinMap[wf.workflowId] = !!appVersion.app.isPreset;
          }
        } catch {
          // 忽略单个 workflow 的查询错误，避免影响整体列表
        }
      }),
    );

    const listWithBuiltin = filledList.map((item) => ({
      ...item,
      builtin: !!builtinMap[item.workflowId],
    }));

    return {
      totalCount,
      list: listWithBuiltin,
    };
  }

  /**
   * 创建workflow并验证依赖
   * 用于前端创建和导入场景的容错处理
   *
   * 功能：
   * 1. 检查并清理缺失的资产引用（导入场景）
   * 2. 创建workflow
   * 3. 页面创建由 listWorkflowPagesAndCreateIfNotExists 懒加载处理
   *
   * @param teamId 团队ID
   * @param userId 用户ID
   * @param data 工作流数据
   * @returns 工作流ID和警告信息
   */
  public async createWorkflowDefWithValidation(teamId: string, userId: string, data: CreateWorkflowData): Promise<{ workflowId: string; warnings: string[] }> {
    const warnings: string[] = [];

    // 1. 检查并清理缺失的资产引用（主要用于导入场景）
    if (data.tasks && data.tasks.length > 0) {
      const { workflow: cleanedData, assetWarnings } = await this.cleanMissingAssetReferences(
        { tasks: data.tasks } as any,
        teamId,
        {}, // JSON导入时没有导出的资产
      );

      data.tasks = cleanedData.tasks;
      warnings.push(...assetWarnings);
    }

    // 2. 创建workflow
    const workflowId = await this.createWorkflowDef(teamId, userId, data);

    // 注意：页面会在首次访问时通过 listWorkflowPagesAndCreateIfNotExists 自动创建

    if (warnings.length > 0) {
      logger.warn(`Workflow ${workflowId} 创建成功但有警告: ${warnings.length} 条`);
    }

    return {
      workflowId,
      warnings,
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

  public async importWorkflowByZip(teamId: string, userId: string, zipUrl: string): Promise<{ newWorkflowId: string; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // 1. 解压ZIP
      const { tmpFolder, workflows, llmModels, sdModels, textCollections, tableCollections } = await extractAssetFromZip(zipUrl);

      if (!workflows || workflows.length === 0) {
        throw new Error('ZIP文件中没有workflow定义');
      }

      if (workflows.length !== 1) {
        throw new Error('ZIP文件中必须有且只有一条工作流');
      }

      const workflowData = workflows[0].workflows[0]; // 取第一个workflow的第一个版本
      const workflowPages = workflows[0].pages || [];

      let processedWorkflow: WorkflowExportJson;
      let newWorkflowId: string;

      try {
        // 2. ⭐ 关键：使用市场应用的 processWorkflowSnapshot 处理依赖
        //    这个方法会自动解析 comfyui/子工作流的 appId 引用
        try {
          processedWorkflow = await this.processWorkflowSnapshot(workflowData, teamId);
        } catch (error) {
          // 依赖缺失时不中断，记录警告
          logger.warn(`处理workflow依赖时出错: ${error.message}`);
          warnings.push(`部分依赖无法解析: ${error.message}`);
          processedWorkflow = workflowData; // 使用原始数据
        }

        // 3. 处理其他资产引用（容错模式）
        //    检查workflow中的资产引用，如果本地不存在就清空
        const { workflow: cleanedWorkflow, assetWarnings } = await this.cleanMissingAssetReferences(processedWorkflow, teamId, {
          llmModels,
          sdModels,
          tableCollections,
          textCollections,
        });
        warnings.push(...assetWarnings);

        // 4. 导入workflow（使用内部方法，复用市场应用逻辑）
        const result = await this.importWorkflow(teamId, userId, {
          workflows: [cleanedWorkflow],
          pages: workflowPages,
        });

        newWorkflowId = result.id;

        logger.log(`成功导入workflow: ${newWorkflowId}, 警告数: ${warnings.length}`);
      } catch (error) {
        throw new Error(`导入工作流失败: ${error.message}`);
      } finally {
        // 清理临时文件
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

      return {
        newWorkflowId,
        warnings,
      };
    } catch (error) {
      logger.error('导入workflow失败', error);
      throw error;
    }
  }

  /**
   * 删除 workflow（conductor 里面的 workflow 定义不要删，保留一下备份，不然日志那些都查不到了）
   */
  public async deleteWorkflowDef(teamId: string, workflowId: string) {
    // 内置应用只读控制：仅作者团队可删除
    const workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(workflowId, false);
    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！`);
    }
    await this.assetsPermissionService.assertCanWriteAsset(teamId, workflow);
    return await this.workflowRepository.deleteWorkflow(teamId, workflowId);
  }

  public async cloneWorkflowOfVersion(teamId: string, userId: string, originalWorkflowId: string, originalWorkflowVersion: number) {
    const originalWorkflow = await this.workflowRepository.getWorkflowById(originalWorkflowId, originalWorkflowVersion);
    // 内置应用只读控制：仅作者团队可以基于内置应用克隆版本
    await this.assetsPermissionService.assertCanWriteAsset(teamId, originalWorkflow);
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
      // 内置应用只读控制：仅作者团队可以基于内置应用克隆工作流
      await this.assetsPermissionService.assertCanWriteAsset(teamId, originalWorkflow);
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

  public async exportWorkflowByRecordId(recordId: string) {
    const workflow = await this.workflowRepository.getWorkflowByRecordId(recordId);
    const triggers = await this.workflowRepository.listWorkflowTriggers(workflow.workflowId, workflow.version);
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
    const pages = await this.pageService.listWorkflowPagesBrief(workflowId);
    return {
      workflows: workflows,
      pages,
    };
  }

  public async updateWorkflowDef(
    teamId: string,
    workflowId: string,
    version: number,
    updates: {
      displayName?: string | I18nValue;
      description?: string | I18nValue;
      iconUrl?: string;
      tasks?: MonkeyTaskDefTypes[];
      variables?: ToolProperty[];
      validationIssues?: WorkflowValidationIssue[];
      output?: WorkflowOutputValue[];
      exposeOpenaiCompatibleInterface?: boolean;
      rateLimiter?: WorkflowRateLimiter;
      openaiModelName?: string;
      shortcutsFlow?: string;
      forkFromId?: string;
      preferAppId?: string;
    },
    autoBackup = true,
  ) {
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！`);
    }

    // 内置应用只读控制：仅作者团队可修改（通过统一的 AssetsPermissionService）
    await this.assetsPermissionService.assertCanWriteAsset(teamId, workflow);

    // 当为快捷方式时，只允许更新 shortcutsFlow 字段
    if (!isEmpty(workflow?.shortcutsFlow ?? null)) {
      updates = {
        shortcutsFlow: updates.shortcutsFlow,
      };
    }

    const workflowEntity = await this.workflowRepository.updateWorkflowDef(teamId, workflowId, version, updates, autoBackup);
    let validated = workflow.validated;
    let validationIssues: WorkflowValidationIssue[] = [];
    if (updates.tasks || updates.output) {
      validationIssues = await this.workflowValidateService.validateWorkflow(teamId, updates.tasks || workflow.tasks, updates.output || workflow.output || []);
      const errors = validationIssues.filter((i) => i.issueType === ValidationIssueType.ERROR);
      validated = errors.length === 0;
      await this.workflowRepository.updateWorkflowDef(
        teamId,
        workflowId,
        version,
        {
          validationIssues,
          validated,
        },
        autoBackup,
      );
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getById(assetId: string, _teamId: string): Promise<any> {
    return await this.workflowRepository.getWorkflowByRecordId(assetId);
  }

  public async rollbackWorkflow(teamId: string, workflowId: string, version: number) {
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (!workflow) {
      throw new NotFoundException(`工作流 (${workflowId}) 不存在！无法回滚`);
    }
    // 内置应用只读控制：仅作者团队可回滚
    await this.assetsPermissionService.assertCanWriteAsset(teamId, workflow);
    return await this.workflowRepository.rollbackWorkflow(teamId, workflowId, version);
  }
}
