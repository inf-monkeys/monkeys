import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { downloadFileAsBuffer } from '@/common/utils/image';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { generateId } from 'ai';
import JSZip from 'jszip';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';

@Injectable()
export class DesignProjectService {
  constructor(
    private readonly designProjectRepository: DesignProjectRepository,
    private readonly designMetadataRepository: DesignMetadataRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  async create(createDesignProjectDto: CreateDesignProjectDto & { teamId: string; creatorUserId: string }, useExistProjectId?: string) {
    const projectEntity = new DesignProjectEntity();

    Object.assign(projectEntity, createDesignProjectDto, {
      assetType: 'design-project',
      version: createDesignProjectDto.version || 1,
    });

    const createdProject = await this.designProjectRepository.create(projectEntity, useExistProjectId);

    // Create a default design metadata for the new project
    await this.designMetadataRepository.createDesignMetadata(createdProject.id, {
      displayName: '画板',
      snapshot: {},
      pinned: false,
      teamId: createDesignProjectDto.teamId,
      designProjectId: createdProject.id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    });

    return createdProject;
  }

  async findById(id: string) {
    return this.designProjectRepository.findById(id);
  }

  async findByTeamId(teamId: string, dto: ListDto) {
    const { totalCount, list } = await this.designProjectRepository.findAllByTeamId(teamId, dto); // [cite: 1293]
    return {
      totalCount,
      list,
    };
  }

  async update(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  async delete(id: string) {
    return this.designProjectRepository.delete(id);
  }

  /**
   * 检查用户是否为团队所有者
   */
  async checkIsTeamOwner(teamId: string, userId: string): Promise<boolean> {
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      return false;
    }
    return team.ownerUserId === userId;
  }

  /**
   * 检查用户是否有权限操作设计模板
   * 只有团队所有者才能操作模板
   */
  async checkTemplatePermission(project: DesignProjectEntity, userId: string): Promise<void> {
    if (project.isTemplate) {
      const isOwner = await this.checkIsTeamOwner(project.teamId, userId);
      if (!isOwner) {
        throw new ForbiddenException('只有团队所有者才能操作设计模板');
      }
    }
  }

  /**
   * Fork 设计模板：复制模板项目及其所有画板到新的设计项目
   */
  async forkTemplate(templateProjectId: string, teamId: string, creatorUserId: string): Promise<DesignProjectEntity> {
    // 获取模板项目
    const templateProject = await this.findById(templateProjectId);
    if (!templateProject) {
      throw new NotFoundException('设计模板不存在');
    }

    if (!templateProject.isTemplate) {
      throw new ForbiddenException('只能 fork 设计模板');
    }

    // 直接创建新的设计项目实体（不调用 create 方法，避免创建默认画板）
    const projectEntity = new DesignProjectEntity();
    Object.assign(projectEntity, {
      displayName: templateProject.displayName,
      description: templateProject.description,
      iconUrl: templateProject.iconUrl,
      sortIndex: templateProject.sortIndex,
      isTemplate: false, // 新项目不是模板
      teamId,
      creatorUserId,
      assetType: 'design-project',
    });

    const newProject = await this.designProjectRepository.create(projectEntity);

    // 获取模板项目的所有画板
    const templateBoards = await this.designMetadataRepository.findAllByProjectId(templateProjectId);

    // 复制所有画板到新项目（包括所有内容和缩略图）
    for (const board of templateBoards) {      
      // 深拷贝 snapshot，确保完全独立
      let snapshotCopy: any = null;
      if (board.snapshot) {
        try {
          // 如果 snapshot 是字符串，先解析；如果是对象，直接深拷贝
          if (typeof board.snapshot === 'string') {
            snapshotCopy = JSON.parse(board.snapshot);
          } else {
            snapshotCopy = JSON.parse(JSON.stringify(board.snapshot));
          }
        } catch (error) {
          snapshotCopy = board.snapshot; // 如果深拷贝失败，使用原始值
        }
      } else {
        // 如果 snapshot 为空，使用空对象而不是 null
        snapshotCopy = {};
      }
      
      const createdBoard = await this.designMetadataRepository.createDesignMetadata(newProject.id, {
        displayName: board.displayName,
        snapshot: snapshotCopy,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl, // 复制缩略图
        teamId,
        designProjectId: newProject.id,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
      
    }

    return newProject;
  }

  /**
   * 从 snapshot 中提取画板内部结构
   */
  private extractBoardStructure(snapshot: any): {
    images: string[];
    frames: string[];
    outputs: string[];
    instructions: string[];
  } {
    const imagesSet = new Set<string>();
    const framesSet = new Set<string>();
    const outputsSet = new Set<string>();
    const instructionsSet = new Set<string>();

    if (!snapshot || !snapshot.document || !snapshot.document.store) {
      return {
        images: [],
        frames: [],
        outputs: [],
        instructions: [],
      };
    }

    const store = snapshot.document.store;

    // 遍历所有 shapes
    for (const key in store) {
      if (!store.hasOwnProperty(key)) continue;
      
      const item = store[key];
      if (!item || typeof item !== 'object') continue;

      // 提取 image 节点（只处理 shape 类型的 image，避免与 asset 重复）
      if (item.type === 'image' && item.typeName === 'shape' && item.props?.src) {
        const src = item.props.src;
        // 从 URL 中提取文件名
        try {
          const url = new URL(src);
          const fileName = url.pathname.split('/').pop() || src;
          imagesSet.add(`image: ${fileName}`);
        } catch {
          // 如果不是有效 URL，直接使用
          imagesSet.add(`image: ${src}`);
        }
      }

      // 提取 asset 中的图片
      if (item.typeName === 'asset' && item.type === 'image' && item.props?.src) {
        const src = item.props.src;
        try {
          const url = new URL(src);
          const fileName = url.pathname.split('/').pop() || item.props.name || src;
          imagesSet.add(`image: ${fileName}`);
        } catch {
          imagesSet.add(`image: ${item.props.name || src}`);
        }
      }

      // 提取 frame 节点
      if (item.type === 'frame' && item.props?.name) {
        framesSet.add(`frame: ${item.props.name}`);
      }

      // 提取 output 节点
      if (item.type === 'output' && item.props) {
        const content = item.props.content || '';
        if (content.trim()) {
          // 截断过长的内容
          const truncated = content.length > 100 
            ? content.substring(0, 100) + '...' 
            : content;
          outputsSet.add(`output: ${truncated}`);
        } else if (item.props.imageUrl) {
          outputsSet.add(`output: [image]`);
        }
      }

      // 提取 instruction 节点
      if (item.type === 'instruction' && item.props) {
        const content = item.props.content || '';
        if (content.trim()) {
          instructionsSet.add(`instruction: ${content}`);
        } else if (item.props.imageUrl) {
          instructionsSet.add(`instruction: [image]`);
        } else {
          instructionsSet.add(`instruction:`);
        }
      }
    }

    return {
      images: Array.from(imagesSet),
      frames: Array.from(framesSet),
      outputs: Array.from(outputsSet),
      instructions: Array.from(instructionsSet),
    };
  }

  /**
   * 生成 UML 文件内容
   */
  private generateUmlFile(project: DesignProjectEntity, boards: any[], exportData: any): string {
    const projectName = typeof project.displayName === 'string' 
      ? project.displayName 
      : JSON.stringify(project.displayName);
    
    let uml = '@startuml\n';
    uml += `title 设计项目: ${projectName}\n\n`;
    
    // 设置布局样式
    uml += 'skinparam packageStyle rectangle\n';
    uml += 'skinparam objectStyle uml2\n';
    uml += 'skinparam linetype ortho\n';
    uml += 'skinparam maxMessageSize 60\n\n';
    
    // 项目信息部分（左侧）
    uml += 'package "项目信息" {\n';
    uml += `  object "项目名称: ${projectName}" as ProjectName\n`;
    
    const desc = project.description 
      ? (typeof project.description === 'string' 
          ? project.description 
          : JSON.stringify(project.description))
      : '无描述';
    uml += `  object "描述: ${desc}" as ProjectDesc\n`;
    uml += `  object "模板: ${project.isTemplate ? '是' : '否'}" as ProjectTemplate\n`;
    uml += '  ProjectName --> ProjectDesc\n';
    uml += '  ProjectName --> ProjectTemplate\n';
    uml += '}\n\n';
    
    // 画板列表部分（右侧），包含画板内部结构
    uml += 'package "画板列表" {\n';
    
    if (boards.length === 0) {
      uml += '  note right: 无画板\n';
    } else {
      // 画板内部结构嵌套在画板列表中
      uml += '  package "图板内部结构" {\n';
      
      // 合并所有画板的结构
      const allImages = new Set<string>();
      const allFrames = new Set<string>();
      const allOutputs = new Set<string>();
      const allInstructions = new Set<string>();
      
      boards.forEach((board) => {
        const structure = this.extractBoardStructure(board.snapshot);
        structure.images.forEach(img => allImages.add(img));
        structure.frames.forEach(frame => allFrames.add(frame));
        structure.outputs.forEach(output => allOutputs.add(output));
        structure.instructions.forEach(instruction => allInstructions.add(instruction));
      });
      
      // image 节点 - 使用 together 关键字强制纵向排列
      if (allImages.size > 0) {
        uml += '    package "image 节点" {\n';
        const imageArray = Array.from(allImages);
        uml += '      together {\n';
        imageArray.forEach((img, imgIndex) => {
          uml += `        object "${img}" as Image_${imgIndex}\n`;
        });
        uml += '      }\n';
        // 添加纵向连接线
        for (let i = 0; i < imageArray.length - 1; i++) {
          uml += `      Image_${i} -[hidden]down- Image_${i + 1}\n`;
        }
        uml += '    }\n';
      }
      
      // frame 节点 - 纵向排列
      if (allFrames.size > 0) {
        uml += '    package "frame 节点" {\n';
        const frameArray = Array.from(allFrames);
        uml += '      together {\n';
        frameArray.forEach((frame, frameIndex) => {
          uml += `        object "${frame}" as Frame_${frameIndex}\n`;
        });
        uml += '      }\n';
        for (let i = 0; i < frameArray.length - 1; i++) {
          uml += `      Frame_${i} -[hidden]down- Frame_${i + 1}\n`;
        }
        uml += '    }\n';
      }
      
      // output 节点 - 纵向排列
      if (allOutputs.size > 0) {
        uml += '    package "output 节点" {\n';
        const outputArray = Array.from(allOutputs);
        uml += '      together {\n';
        outputArray.forEach((output, outputIndex) => {
          uml += `        object "${output}" as Output_${outputIndex}\n`;
        });
        uml += '      }\n';
        for (let i = 0; i < outputArray.length - 1; i++) {
          uml += `      Output_${i} -[hidden]down- Output_${i + 1}\n`;
        }
        uml += '    }\n';
      }
      
      // instruction 节点 - 纵向排列
      if (allInstructions.size > 0) {
        uml += '    package "instruction 节点" {\n';
        const instructionArray = Array.from(allInstructions);
        uml += '      together {\n';
        instructionArray.forEach((instruction, instructionIndex) => {
          uml += `        object "${instruction}" as Instruction_${instructionIndex}\n`;
        });
        uml += '      }\n';
        for (let i = 0; i < instructionArray.length - 1; i++) {
          uml += `      Instruction_${i} -[hidden]down- Instruction_${i + 1}\n`;
        }
        uml += '    }\n';
      }
      
      uml += '  }\n';
    }
    
    uml += '}\n\n';
    
    // 项目名称连接到画板列表
    uml += 'ProjectName --> "画板列表"\n\n';
    
    // 添加 JSON 导出数据作为注释（可选，用于导入时恢复）
    uml += "' JSON_EXPORT_BEGIN\n";
    uml += `' ${JSON.stringify(exportData).replace(/\n/g, '\\n')}\n`;
    uml += "' JSON_EXPORT_END\n";
    uml += '\n';
    
    uml += '@enduml\n';
    
    return uml;
  }

  /**
   * 从 snapshot 中提取所有资源文件 URL
   */
  private extractAssetUrls(snapshot: any): string[] {
    const urls = new Set<string>();
    if (!snapshot || typeof snapshot !== 'object') {
      return [];
    }

    // 递归遍历对象，查找所有可能的资源 URL
    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') {
        return;
      }

      // 检查是否是 asset 对象，包含 src 属性
      if (obj.props?.src && typeof obj.props.src === 'string') {
        const url = obj.props.src;
        // 只添加有效的 HTTP/HTTPS URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
          urls.add(url);
        }
      }

      // 检查 output 节点的 imageUrl 和 images 字段
      if (obj.type === 'output' && obj.props) {
        // 检查 imageUrl 字段
        if (obj.props.imageUrl && typeof obj.props.imageUrl === 'string') {
          const url = obj.props.imageUrl;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            urls.add(url);
          }
        }
        // 检查 images 数组
        if (Array.isArray(obj.props.images)) {
          obj.props.images.forEach((img: any) => {
            if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
              urls.add(img);
            }
          });
        }
      }

      // 检查其他可能的 URL 字段
      if (obj.src && typeof obj.src === 'string') {
        const url = obj.src;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          urls.add(url);
        }
      }

      if (obj.url && typeof obj.url === 'string') {
        const url = obj.url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          urls.add(url);
        }
      }

      // 检查 imageUrl, image_url, image, imageURL 等字段
      const imageUrlFields = ['imageUrl', 'image_url', 'image', 'imageURL'];
      for (const field of imageUrlFields) {
        if (obj[field] && typeof obj[field] === 'string') {
          const url = obj[field];
          if (url.startsWith('http://') || url.startsWith('https://')) {
            urls.add(url);
          }
        }
      }

      // 检查 images 数组字段
      if (Array.isArray(obj.images)) {
        obj.images.forEach((img: any) => {
          if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
            urls.add(img);
          }
        });
      }

      // 递归遍历所有属性
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          traverse(obj[key]);
        }
      }
    };

    traverse(snapshot);
    return Array.from(urls);
  }

  /**
   * 导出设计项目：获取项目及其所有画板的完整数据
   */
  async exportProject(projectId: string, userId: string) {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }

    // 如果是模板，检查权限：只有团队所有者才能导出模板
    if (project.isTemplate) {
      await this.checkTemplatePermission(project, userId);
    }
    // 普通设计项目允许所有人导出

    // 获取所有画板（包括snapshot）
    const boards = await this.designMetadataRepository.findAllByProjectId(projectId);

    // 构建导出数据
    return {
      version: '1.0',
      exportTime: Date.now(),
      project: {
        displayName: project.displayName,
        description: project.description,
        iconUrl: project.iconUrl,
        isTemplate: project.isTemplate,
      },
      boards: boards.map((board) => ({
        displayName: board.displayName,
        snapshot: board.snapshot,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl,
      })),
    };
  }

  /**
   * 导出设计项目为压缩包：包含 JSON 数据和所有资源文件
   */
  async exportProjectAsZip(projectId: string, userId: string): Promise<Buffer> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }

    // 如果是模板，检查权限：只有团队所有者才能导出模板
    if (project.isTemplate) {
      await this.checkTemplatePermission(project, userId);
    }
    // 普通设计项目允许所有人导出

    // 获取所有画板（包括snapshot）
    const boards = await this.designMetadataRepository.findAllByProjectId(projectId);

    // 构建导出数据
    const exportData = {
      version: '1.0',
      exportTime: Date.now(),
      project: {
        displayName: project.displayName,
        description: project.description,
        iconUrl: project.iconUrl,
        isTemplate: project.isTemplate,
      },
      boards: boards.map((board) => ({
        displayName: board.displayName,
        snapshot: board.snapshot,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl,
      })),
    };

    // 创建 ZIP 文件
    const zip = new JSZip();

    // 添加 JSON 文件
    zip.file('project.json', JSON.stringify(exportData, null, 2));

    // 生成 UML 文件
    const umlContent = this.generateUmlFile(project, boards, exportData);
    zip.file('project.uml', umlContent);

    // 收集所有资源文件 URL
    const assetUrls = new Set<string>();
    
    // 从项目图标 URL 中提取
    if (project.iconUrl && (project.iconUrl.startsWith('http://') || project.iconUrl.startsWith('https://'))) {
      assetUrls.add(project.iconUrl);
    }

    // 从画板的 snapshot 和缩略图中提取
    for (const board of boards) {
      // 提取 snapshot 中的资源 URL
      const snapshotUrls = this.extractAssetUrls(board.snapshot);
      snapshotUrls.forEach((url) => assetUrls.add(url));

      // 添加缩略图 URL
      if (board.thumbnailUrl && (board.thumbnailUrl.startsWith('http://') || board.thumbnailUrl.startsWith('https://'))) {
        assetUrls.add(board.thumbnailUrl);
      }
    }

    // 下载所有资源文件并添加到压缩包
    if (assetUrls.size > 0) {
      const assetsFolder = zip.folder('assets');
      const urlToFileName = new Map<string, string>(); // URL -> 文件名的映射
      
      const downloadPromises = Array.from(assetUrls).map(async (url, index) => {
        try {
          // 下载文件
          const buffer = await downloadFileAsBuffer(url);
          
          // 从 URL 中提取文件名
          const urlPath = new URL(url).pathname;
          let fileName = urlPath.split('/').pop() || `asset-${index}`;
          
          // 如果文件名没有扩展名，尝试从 URL 推断
          if (!fileName.includes('.')) {
            // 尝试从 URL 路径推断文件类型
            const contentType = url.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|pdf|zip)/i);
            if (contentType) {
              fileName = `${fileName}.${contentType[1]}`;
            } else {
              // 如果无法推断，使用 URL 的 hash 作为文件名的一部分
              const urlHash = Buffer.from(url).toString('base64').substring(0, 8).replace(/[^a-zA-Z0-9]/g, '');
              fileName = `asset-${urlHash}.bin`;
            }
          }
          
          // 确保文件名唯一（如果重复，添加索引）
          let finalFileName = fileName;
          let counter = 1;
          while (Array.from(urlToFileName.values()).includes(finalFileName)) {
            const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
            const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            finalFileName = ext ? `${baseName}-${counter}.${ext}` : `${baseName}-${counter}`;
            counter++;
          }
          
          urlToFileName.set(url, finalFileName);
          
          // 添加到压缩包
          assetsFolder.file(finalFileName, buffer);
        } catch (error) {
          // 如果下载失败，记录错误但继续处理其他文件
          console.error(`Failed to download asset from ${url}:`, error);
        }
      });

      // 等待所有文件下载完成
      await Promise.all(downloadPromises);
      
      // 将 URL 映射保存到压缩包中，方便导入时使用
      if (urlToFileName.size > 0) {
        const urlMapping = Object.fromEntries(urlToFileName);
        zip.file('url-mapping.json', JSON.stringify(urlMapping, null, 2));
      }
    }

    // 生成 ZIP 文件
    return await zip.generateAsync({ type: 'nodebuffer' });
  }

  /**
   * 导入设计项目：从JSON数据创建新的设计项目
   */
  async importProject(
    importData: {
      version?: string;
      project: {
        displayName: string | Record<string, string>;
        description?: string | Record<string, string>;
        iconUrl?: string;
        isTemplate?: boolean;
      };
      boards: Array<{
        displayName: string | Record<string, string>;
        snapshot: any;
        pinned?: boolean;
        thumbnailUrl?: string;
      }>;
    },
    teamId: string,
    creatorUserId: string,
  ): Promise<DesignProjectEntity> {
    // 如果导入的是模板，检查权限：只有团队所有者才能导入模板
    if (importData.project.isTemplate) {
      const isOwner = await this.checkIsTeamOwner(teamId, creatorUserId);
      if (!isOwner) {
        throw new ForbiddenException('只有团队所有者才能导入设计模板');
      }
    }
    // 普通设计项目允许所有人导入

    // 创建新的设计项目
    const projectEntity = new DesignProjectEntity();
    Object.assign(projectEntity, {
      displayName: importData.project.displayName,
      description: importData.project.description,
      iconUrl: importData.project.iconUrl,
      isTemplate: importData.project.isTemplate ?? false,
      teamId,
      creatorUserId,
      assetType: 'design-project',
    });

    const newProject = await this.designProjectRepository.create(projectEntity);

    // 导入所有画板
    for (const boardData of importData.boards) {
      // 深拷贝 snapshot
      let snapshotCopy: any = null;
      if (boardData.snapshot) {
        try {
          if (typeof boardData.snapshot === 'string') {
            snapshotCopy = JSON.parse(boardData.snapshot);
          } else {
            snapshotCopy = JSON.parse(JSON.stringify(boardData.snapshot));
          }
        } catch (error) {
          snapshotCopy = boardData.snapshot;
        }
      } else {
        snapshotCopy = {};
      }

      // 处理 displayName：如果是对象，转换为字符串；如果是字符串，直接使用
      const displayNameStr =
        typeof boardData.displayName === 'string'
          ? boardData.displayName
          : JSON.stringify(boardData.displayName);

      await this.designMetadataRepository.createDesignMetadata(newProject.id, {
        displayName: displayNameStr,
        snapshot: snapshotCopy,
        pinned: boardData.pinned ?? false,
        thumbnailUrl: boardData.thumbnailUrl,
        teamId,
        designProjectId: newProject.id,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
    }

    return newProject;
  }

  /**
   * 从 ZIP 文件导入设计项目：解压 ZIP、上传资源文件、更新 URL 映射
   */
  async importProjectFromZip(zipBuffer: Buffer, teamId: string, creatorUserId: string): Promise<DesignProjectEntity> {
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(zipBuffer);

    // 1. 读取 project.json
    const projectJsonFile = unzipped.file('project.json');
    if (!projectJsonFile) {
      throw new NotFoundException('ZIP 文件中未找到 project.json');
    }

    const projectJsonContent = await projectJsonFile.async('string');
    let importData: any;
    try {
      importData = JSON.parse(projectJsonContent);
    } catch (error) {
      throw new Error('project.json 格式错误');
    }

    // 验证导入数据格式
    if (!importData.project || !importData.boards) {
      throw new Error('导入文件格式不正确，缺少必要的数据');
    }

    // 2. 读取 URL 映射文件（如果存在）
    let urlToFileName: Record<string, string> = {};
    const urlMappingFile = unzipped.file('url-mapping.json');
    if (urlMappingFile) {
      try {
        const urlMappingContent = await urlMappingFile.async('string');
        urlToFileName = JSON.parse(urlMappingContent);
      } catch (error) {
        console.error('Failed to parse url-mapping.json:', error);
      }
    }

    // 3. 上传 assets 文件夹中的文件并创建 URL 映射
    const urlMapping = new Map<string, string>(); // 旧 URL -> 新 URL 的映射
    const assetsFolder = unzipped.folder('assets');
    
    if (assetsFolder) {
      const s3Helpers = new S3Helpers();
      const assetFiles = Object.keys(assetsFolder.files).filter((name) => !assetsFolder.files[name].dir);

      // 上传所有资源文件到 S3
      for (const assetFileName of assetFiles) {
        const assetFile = assetsFolder.files[assetFileName];
        if (!assetFile) continue;

        try {
          const assetBuffer = await assetFile.async('nodebuffer');
          
          // 生成新的文件路径
          const fileId = generateId();
          const fileExtension = assetFileName.split('.').pop() || '';
          const s3Key = `user-files/designs/${fileId}${fileExtension ? '.'.concat(fileExtension) : ''}`;
          
          // 上传到 S3
          const newUrl = await s3Helpers.uploadFile(assetBuffer, s3Key);
          
          // 通过 url-mapping.json 找到对应的原始 URL
          for (const [originalUrl, fileName] of Object.entries(urlToFileName)) {
            if (fileName === assetFileName) {
              urlMapping.set(originalUrl, newUrl);
              break;
            }
          }
          
          // 如果没有找到映射，尝试通过文件名匹配（兼容旧版本）
          if (urlMapping.size === 0 || !Array.from(urlMapping.values()).includes(newUrl)) {
            // 收集所有需要替换的 URL
            const allUrls = new Set<string>();
            if (importData.project.iconUrl) {
              allUrls.add(importData.project.iconUrl);
            }
            for (const board of importData.boards) {
              if (board.thumbnailUrl) {
                allUrls.add(board.thumbnailUrl);
              }
              if (board.snapshot) {
                const snapshotUrls = this.extractAssetUrls(board.snapshot);
                snapshotUrls.forEach((url) => allUrls.add(url));
              }
            }
            
            // 尝试通过 URL 路径匹配文件名
            for (const url of allUrls) {
              try {
                const urlPath = new URL(url).pathname;
                const urlFileName = urlPath.split('/').pop();
                if (urlFileName === assetFileName || assetFileName.includes(urlFileName?.split('.')[0] || '')) {
                  urlMapping.set(url, newUrl);
                }
              } catch (error) {
                // URL 解析失败，跳过
              }
            }
          }
        } catch (error) {
          console.error(`Failed to upload asset ${assetFileName}:`, error);
          // 继续处理其他文件
        }
      }
    }

    // 4. 更新 importData 中的 URL
    // 3.1 更新项目图标 URL
    if (importData.project.iconUrl && urlMapping.has(importData.project.iconUrl)) {
      importData.project.iconUrl = urlMapping.get(importData.project.iconUrl)!;
    }

    // 3.2 更新画板中的 URL（snapshot 和 thumbnailUrl）
    for (const board of importData.boards) {
      // 更新缩略图 URL
      if (board.thumbnailUrl && urlMapping.has(board.thumbnailUrl)) {
        board.thumbnailUrl = urlMapping.get(board.thumbnailUrl)!;
      }

      // 更新 snapshot 中的 URL
      if (board.snapshot) {
        board.snapshot = this.replaceUrlsInSnapshot(board.snapshot, urlMapping);
      }
    }

    // 5. 导入时强制设置为非模板（普通设计项目）
    importData.project.isTemplate = false;

    // 6. 调用现有的 importProject 方法
    return await this.importProject(importData, teamId, creatorUserId);
  }

  /**
   * 替换数据中的 URL：从 URL 映射中查找并返回新 URL
   */
  private replaceUrlInData(oldUrl: string, urlMapping: Map<string, string>, unzipped: JSZip): string | null {
    if (!oldUrl || typeof oldUrl !== 'string') {
      return null;
    }

    // 直接从映射中查找
    if (urlMapping.has(oldUrl)) {
      return urlMapping.get(oldUrl)!;
    }

    return null;
  }

  /**
   * 递归替换 snapshot 中的所有 URL
   */
  private replaceUrlsInSnapshot(snapshot: any, urlMapping: Map<string, string>): any {
    if (!snapshot || typeof snapshot !== 'object') {
      return snapshot;
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(snapshot)) {
      return snapshot.map((item) => this.replaceUrlsInSnapshot(item, urlMapping));
    }

    // 创建副本
    const result = JSON.parse(JSON.stringify(snapshot));

    // 替换可能的 URL 字段
    const urlFields = ['src', 'url', 'imageUrl', 'image_url', 'image', 'imageURL', 'thumbnailUrl'];
    for (const field of urlFields) {
      if (result[field] && typeof result[field] === 'string' && urlMapping.has(result[field])) {
        result[field] = urlMapping.get(result[field])!;
      }
    }

    // 处理 props 对象
    if (result.props) {
      for (const field of urlFields) {
        if (result.props[field] && typeof result.props[field] === 'string' && urlMapping.has(result.props[field])) {
          result.props[field] = urlMapping.get(result.props[field])!;
        }
      }

      // 处理 images 数组
      if (Array.isArray(result.props.images)) {
        result.props.images = result.props.images.map((img: any) => {
          if (typeof img === 'string' && urlMapping.has(img)) {
            return urlMapping.get(img)!;
          }
          return img;
        });
      }
    }

    // 处理 images 数组字段
    if (Array.isArray(result.images)) {
      result.images = result.images.map((img: any) => {
        if (typeof img === 'string' && urlMapping.has(img)) {
          return urlMapping.get(img)!;
        }
        return img;
      });
    }

    // 递归处理所有属性
    for (const key in result) {
      if (result.hasOwnProperty(key) && typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.replaceUrlsInSnapshot(result[key], urlMapping);
      }
    }

    return result;
  }

  /**
   * 获取设计项目的所有版本
   */
  async getProjectVersions(projectId: string): Promise<DesignProjectEntity[]> {
    return this.designProjectRepository.findAllVersionsByProjectId(projectId);
  }

  /**
   * 创建设计项目的新版本
   * 类似于工作流的版本管理，会复制当前版本的所有内容到新版本
   */
  async createProjectVersion(
    projectId: string,
    currentVersion: number,
    teamId: string,
    creatorUserId: string,
    updates?: {
      displayName?: string;
      description?: string;
      iconUrl?: string;
    },
  ): Promise<DesignProjectEntity> {
    // 获取源项目
    const sourceProject = await this.designProjectRepository.findByProjectIdAndVersion(projectId, currentVersion);
    if (!sourceProject) {
      throw new NotFoundException('源设计项目不存在');
    }

    // 检查权限
    if (sourceProject.teamId !== teamId) {
      throw new ForbiddenException('无权操作此设计项目');
    }

    // 获取下一个版本号
    const nextVersion = (await this.designProjectRepository.getLatestVersion(projectId)) + 1;

    // 创建新版本的项目
    const newProject = await this.designProjectRepository.createNewVersion(projectId, currentVersion, nextVersion, {
      ...updates,
      teamId,
      creatorUserId,
    });

    // 复制所有画板到新版本
    const sourceBoards = await this.designMetadataRepository.findAllByProjectId(sourceProject.id);
    for (const board of sourceBoards) {
      // 深拷贝 snapshot
      let snapshotCopy: any = null;
      if (board.snapshot) {
        try {
          if (typeof board.snapshot === 'string') {
            snapshotCopy = JSON.parse(board.snapshot);
          } else {
            snapshotCopy = JSON.parse(JSON.stringify(board.snapshot));
          }
        } catch (error) {
          snapshotCopy = board.snapshot;
        }
      } else {
        snapshotCopy = {};
      }

      await this.designMetadataRepository.createDesignMetadata(newProject.id, {
        displayName: board.displayName,
        snapshot: snapshotCopy,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl,
        teamId,
        designProjectId: newProject.id,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
    }

    return newProject;
  }

  /**
   * 根据 projectId 查找最新版本的设计项目
   */
  async findLatestByProjectId(projectId: string): Promise<DesignProjectEntity | null> {
    const versions = await this.designProjectRepository.findAllVersionsByProjectId(projectId);
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * 删除指定版本
   * 注意：不能删除当前正在使用的版本，需要至少保留一个版本
   */
  async deleteProjectVersion(
    projectId: string,
    version: number,
    teamId: string,
    userId: string,
  ): Promise<void> {
    // 获取该 projectId 的所有版本
    const versions = await this.designProjectRepository.findAllVersionsByProjectId(projectId);
    
    if (versions.length <= 1) {
      throw new ForbiddenException('至少需要保留一个版本');
    }

    // 查找要删除的版本
    const versionToDelete = versions.find(v => v.version === version);
    if (!versionToDelete) {
      throw new NotFoundException('版本不存在');
    }

    // 检查权限
    if (versionToDelete.teamId !== teamId) {
      throw new ForbiddenException('无权删除此版本');
    }

    // 删除该版本（软删除）
    await this.delete(versionToDelete.id);
  }
}
