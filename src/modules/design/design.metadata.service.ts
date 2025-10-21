import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import _ from 'lodash';
import { DesignThumbnailService } from './design-thumbnail.service';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';

@Injectable()
export class DesignMetadataService {
  constructor(
    private readonly designMetadataRepository: DesignMetadataRepository,
    private readonly designThumbnailService: DesignThumbnailService,
  ) {}

  async create(designProjectId: string, teamId: string, createDesignMetadataDto: CreateDesignMetadataDto) {
    return await this.designMetadataRepository.createDesignMetadata(designProjectId, {
      ...createDesignMetadataDto,
      teamId,
    });
  }

  async findByMetadataId(metadataId: string) {
    const data = await this.designMetadataRepository.findById(metadataId);
    return data;
  }

  async findAllByProjectId(projectId: string) {
    const data = await this.designMetadataRepository.findAllByProjectId(projectId);
    return data;
  }

  async findAllByProjectIdWithourSnapshot(projectId: string) {
    const data = await this.designMetadataRepository.findAllByProjectId(projectId);
    return data.map((v) => _.omit(v, ['snapshot']));
  }

  async update(id: string, updateDesignMetadataDto: UpdateDesignMetadataDto) {
    const designMetadata = await this.designMetadataRepository.findById(id);
    if (!designMetadata) {
      throw new NotFoundException('设计画板不存在');
    }
    return await this.designMetadataRepository.update(id, updateDesignMetadataDto);
  }

  /**
   * 生成画板缩略图
   */
  async generateThumbnail(boardId: string, imageData: string): Promise<void> {
    try {
      await this.designThumbnailService.updateBoardThumbnailFromImageData(boardId, imageData);
    } catch (error) {
      console.error(`生成画板 ${boardId} 缩略图失败:`, error);
      throw error;
    }
  }

  async remove(id: string) {
    return this.designMetadataRepository.deleteById(id);
  }
}
