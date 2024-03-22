import { logger } from '@/common/logger';
import { IRequest } from '@/common/typings/request';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { WorkflowRepository } from '../../repositories/workflow.repository';
import { LlmModelJson, RichMediaJson, SdModelJson, TableCollectionsJson, TeamInfoJson, TextCollectionJson, WorkflowWithPagesJson } from '../workflow/interfaces';
import { WorkflowCrudService } from '../workflow/workflow.curd.service';
import { ExportTeamDto } from './dto/export-team.dto';

@Injectable()
export class ExportService {
  constructor(
    private readonly workflowCrudService: WorkflowCrudService,
    private readonly workflowRepository: WorkflowRepository,
  ) {}

  public async exportTeamData(req: IRequest, dto: ExportTeamDto) {
    const { teamId } = req;
    const { exportRichMedias, exportSqlTables, exportVectorDatabases, exportWorkflows, exportLlmModel, exportSdModel } = dto;
    // const rawTeamInfo = await this.teamService.getTeamById(teamId);
    // const teamInfo: TeamInfoJson = {
    //   name: rawTeamInfo.name,
    //   description: rawTeamInfo.description,
    //   logoUrl: rawTeamInfo.iconUrl,
    //   workflowTaskNamePrefix: rawTeamInfo.workflowTaskNamePrefix,
    //   customTheme: rawTeamInfo.customTheme,
    // };
    const teamInfo: TeamInfoJson = {} as TeamInfoJson;

    // 导出工作流文件
    const workflows: WorkflowWithPagesJson[] = [];
    if (exportWorkflows) {
      const workflowList = await this.workflowRepository.getAllWorkflowsInTeam(teamId);
      const workflowIds = workflowList.map((x) => x.workflowId);
      await Promise.all(
        workflowIds.map(async (workflowId) => {
          try {
            const result = await this.workflowCrudService.exportWorkflow(workflowId);
            workflows.push(result);
          } catch (error) {
            logger.warn(`导出 ${workflowId} 失败: `, error);
          }
        }),
      );
    }

    // 导出 sql 数据库
    let sqlDatabases: TableCollectionsJson[] = [];
    if (exportSqlTables) {
      // sqlDatabases = await this.tableCollectionService.exportAllDatabase(teamId);
    }

    // 导出富媒体数据
    let richMedias: RichMediaJson[] = [];
    if (exportRichMedias) {
      // const rawResources = await this.resourceService.exportResources(teamId);
      // richMedias = rawResources.map((resource) => ({
      //   type: resource.type,
      //   name: resource.name,
      //   url: resource.url,
      //   size: resource.size,
      //   source: resource.source,
      //   params: resource.params,
      //   // FIXME: 暂时写死
      //   tags: [],
      // }));
    }

    // 导出向量数据库数据
    let vectorDatabases: TextCollectionJson[] = [];
    if (exportVectorDatabases) {
      // vectorDatabases = await this.vectorService.exportAllCollections(teamId);
    }

    // 导出 sd 模型
    let sdModels: SdModelJson[] = [];
    if (exportSdModel) {
      // sdModels = await this.sdModelService.exportSdModels(req);
    }

    // 导出 llm 模型
    let llmModels: LlmModelJson[] = [];
    if (exportLlmModel) {
      // llmModels = await this.llmModelService.exportLlmModels(req);
    }

    return {
      teamInfo,
      workflows,
      sqlDatabases,
      richMedias,
      vectorDatabases,
      sdModels,
      llmModels,
    };
  }

  public async importTeamData(
    teamId: string,
    userId: string,
    data: {
      workflows: WorkflowWithPagesJson[];
      tableCollections: TableCollectionsJson[];
      richMedias: RichMediaJson[];
      textCollections: TextCollectionJson[];
      sdModels: SdModelJson[];
      llmModels: LlmModelJson[];
    },
  ) {
    const { workflows, tableCollections, richMedias, textCollections, sdModels, llmModels } = data;
    // 导入表格数据
    const replaceSqlDatabaseMap = {};
    console.log('开始导入表格数据集：', tableCollections.length);
    for (const infoJson of tableCollections) {
      // const sqlDatabaseId = await this.tableCollectionService.importDatabase(teamId, userId, infoJson);
      // replaceSqlDatabaseMap[infoJson.originalId] = sqlDatabaseId;
    }

    // 导入向量数据库
    console.log('开始导入文本数据集：', textCollections.length);
    const replaceVectorDatabaseMap = {};
    if (textCollections.length) {
      for (const infoJson of textCollections) {
        // const collectionName = await this.vectorService.importCollection(teamId, userId, infoJson);
        // replaceVectorDatabaseMap[infoJson.originalId] = collectionName;
      }
    }

    // 导入 llm model
    const replaceLlmModelMap = {};
    console.log('开始导入文本模型：', llmModels.length);
    const llmModelsChunks = _.chunk(llmModels, 10);
    for (const chunk of llmModelsChunks) {
      await Promise.all(
        chunk.map(async (c) => {
          // const originalModelId = c.originalId;
          // const newLlmModel = await this.llmModelAssetSvc.createAsset('llm-model', c, {
          //   teamId,
          //   userId,
          // });
          // replaceLlmModelMap[originalModelId] = newLlmModel._id.toHexString();
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
          // const originalModelId = c.originalId;
          // const newSdModel = await this.sdModelAssetSvc.createAsset('sd-model', c, { teamId, userId });
          // replaceSdModelMap[originalModelId] = newSdModel._id.toHexString();
        }),
      );
    }

    // 导入工作流
    const workflowChunks = _.chunk(workflows, 5);
    for (const chunk of workflowChunks) {
      await Promise.all(
        chunk.map(async (workflowJson) => {
          return await this.workflowCrudService.createWorkflowDef(teamId, userId, workflowJson.workflows[0], {
            replaceSqlDatabaseMap,
            replaceVectorDatabaseMap,
            replaceLlmModelMap,
            replaceSdModelMap,
          });
        }),
      );
    }

    // 导入富媒体资源
    const richMediaChunks = _.chunk(richMedias, 20);
    for (const chunk of richMediaChunks) {
      // await this.resourceService.importResourcesBatch(teamId, userId, chunk);
    }
  }
}
