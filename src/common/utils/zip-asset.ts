import { LlmModelJson, RichMediaJson, SdModelJson, TableCollectionsJson, TeamInfoJson, TextCollectionJson, WorkflowWithPagesJson } from '@/modules/workflow/interfaces';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { logger } from '../logger';
import { findFilesInDir } from './file';
import { generateRandomString, getAndEnsureTempDataFolder } from './utils';
import { downloadAndUnzip } from './zip';

export interface GenerateZipParams {
  teamInfo?: TeamInfoJson;
  workflows?: WorkflowWithPagesJson[];
  tableCollections?: TableCollectionsJson[];
  richMedias?: RichMediaJson[];
  textCollections?: TextCollectionJson[];
  sdModels?: SdModelJson[];
  llmModels?: LlmModelJson[];
}
export const generateZip = async (params: GenerateZipParams) => {
  const { teamInfo, workflows, tableCollections, richMedias, textCollections, sdModels, llmModels } = params;
  // 创建 zip 文件
  const zip = new JSZip();

  // 写入团队 json 文件
  if (teamInfo) {
    zip.file('team.json', JSON.stringify(teamInfo));
  }

  // 写入工作流文件
  if (workflows?.length) {
    const workflowsFolder = zip.folder('workflows');
    workflows.forEach((workflowJson, i) => {
      const fileContent = JSON.stringify(workflowJson);
      const name = workflowJson.workflows[0].displayName;
      workflowsFolder.file(`${i}-${name}.json`, fileContent);
    });
  }

  // 写入 sql 数据库
  if (tableCollections?.length) {
    const sqlFilesFolder = zip.folder('tableCollections');
    tableCollections.forEach((sqlDatabase, i) => {
      const databaseFolder = sqlFilesFolder.folder(`${i}-${sqlDatabase.name}`);
      const sqlFile = sqlDatabase.sqlFile;
      delete sqlDatabase.sqlFile;
      databaseFolder.file('info.json', JSON.stringify(sqlDatabase));
      if (fs.existsSync(sqlFile)) {
        databaseFolder.file('data.db', fs.readFileSync(sqlFile));
      }
    });
  }

  // 写入富媒体数据
  if (richMedias?.length) {
    zip.file('richMedia.json', JSON.stringify(richMedias));
  }

  // 写入向量数据库数据
  if (textCollections?.length) {
    const vectorDatabasesFolder = zip.folder('textCollections');
    textCollections.forEach((vectorDatabase, i) => {
      vectorDatabasesFolder.file(`${i}-${vectorDatabase.displayName}.json`, JSON.stringify(vectorDatabase));
    });
  }

  // 写入 sd 模型
  if (sdModels?.length) {
    const sdModelsFolder = zip.folder('sdModels');
    sdModels.forEach((sdModel, i) => {
      sdModelsFolder.file(`${i}-${sdModel.name}.json`, JSON.stringify(sdModel));
    });
  }

  // 写入 llm 模型
  if (llmModels?.length) {
    const llmModelsFolder = zip.folder('llmModels');
    llmModels.forEach((llmModel, i) => {
      llmModelsFolder.file(`${i}-${llmModel.name}.json`, JSON.stringify(llmModel));
    });
  }

  // 生成ZIP并发送
  return await zip.generateAsync({ type: 'nodebuffer' });
};

export const extractAssetFromZip = async (zipUrl: string) => {
  // 下载 zip 文件并解压到本地
  const rootTmpFolder = getAndEnsureTempDataFolder();
  const tmpFolder = path.join(rootTmpFolder, 'team-import', generateRandomString(20));
  await downloadAndUnzip(zipUrl, tmpFolder);
  logger.info('下载 zip 并解压到：', tmpFolder);
  // 导入团队基本信息
  const teamJsonFile = path.join(tmpFolder, 'team.json');
  let teamJson: TeamInfoJson;
  if (fs.existsSync(teamJsonFile)) {
    teamJson = JSON.parse(fs.readFileSync(teamJsonFile, 'utf-8'));
  }

  // 读取工作流
  let workflows: WorkflowWithPagesJson[] = [];
  const workflowsFolder = path.join(tmpFolder, 'workflows');
  if (fs.existsSync(workflowsFolder)) {
    const workflowJsonFiles = findFilesInDir(workflowsFolder, '.json');
    workflows = workflowJsonFiles.map((workflowJsonFile) => {
      return JSON.parse(fs.readFileSync(workflowJsonFile, 'utf-8'));
    });
  }

  // 读取表格数据
  const sqlDatabaseFolder = path.join(tmpFolder, 'tableCollections');
  const tableCollections: TableCollectionsJson[] = [];
  if (fs.existsSync(sqlDatabaseFolder)) {
    const sqlDatabaseSubFolders = fs.readdirSync(sqlDatabaseFolder);
    for (let sqlDatabaseSubFolder of sqlDatabaseSubFolders) {
      sqlDatabaseSubFolder = path.join(sqlDatabaseFolder, sqlDatabaseSubFolder);
      const infoFile = path.join(sqlDatabaseSubFolder, 'info.json');
      const infoJson: TableCollectionsJson = JSON.parse(fs.readFileSync(infoFile, 'utf-8'));
      const dbFile = path.join(sqlDatabaseSubFolder, 'data.db');
      if (fs.existsSync(dbFile)) {
        infoJson.sqlFile = dbFile;
      }
      tableCollections.push(infoJson);
    }
  }

  // 读取富媒体资源
  const richMediaFile = path.join(tmpFolder, 'richMedia.json');
  let richMedias: RichMediaJson[] = [];
  if (fs.existsSync(richMediaFile)) {
    richMedias = JSON.parse(fs.readFileSync(richMediaFile, 'utf-8'));
  }

  // 读取向量数据库
  const textCollections: TextCollectionJson[] = [];
  const vectorDatabaseFolder = path.join(tmpFolder, 'textCollections');
  if (fs.existsSync(vectorDatabaseFolder)) {
    const vectorDatabaseFiles = findFilesInDir(vectorDatabaseFolder, '.json');
    for (const vectorFile of vectorDatabaseFiles) {
      const infoJson: TextCollectionJson = JSON.parse(fs.readFileSync(vectorFile, 'utf-8'));
      textCollections.push(infoJson);
    }
  }

  // 读取 llm 模型
  const llmModels: LlmModelJson[] = [];
  const llmModelsFolder = path.join(tmpFolder, 'llmModels');
  if (fs.existsSync(llmModelsFolder)) {
    const llmModelFiles = findFilesInDir(llmModelsFolder, '.json');
    for (const llmModelFile of llmModelFiles) {
      const infoJson: LlmModelJson = JSON.parse(fs.readFileSync(llmModelFile, 'utf-8'));
      llmModels.push(infoJson);
    }
  }

  // 读取 sd 模型
  const sdModels: SdModelJson[] = [];
  const sdModelsFolder = path.join(tmpFolder, 'sdModels');
  if (fs.existsSync(sdModelsFolder)) {
    const sdModelFiles = findFilesInDir(sdModelsFolder, '.json');
    for (const sdModelFile of sdModelFiles) {
      const infoJson: SdModelJson = JSON.parse(fs.readFileSync(sdModelFile, 'utf-8'));
      sdModels.push(infoJson);
    }
  }

  return {
    teamJson,
    workflows,
    sdModels,
    llmModels,
    richMedias,
    tableCollections,
    textCollections,
    tmpFolder,
  };
};
