import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { ModelTrainingEntity, ModelTrainingStatus } from '@/database/entities/model-training/model-training';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateModelTrainingDto } from './dto/create-model-training.dto';

@Injectable()
export class ModelTrainingService {
  constructor(
    @InjectRepository(ModelTrainingEntity)
    private readonly modelTrainingRepository: Repository<ModelTrainingEntity>,
  ) {}

  async create(createModelTrainingDto: CreateModelTrainingDto & { teamId: string }) {
    const id = generateDbId();
    const modelTraining = this.modelTrainingRepository.create({
      ...createModelTrainingDto,
      id,
      status: createModelTrainingDto.status ?? ModelTrainingStatus.IDLE,
      teamId: createModelTrainingDto.teamId,
    });
    return this.modelTrainingRepository.save(modelTraining);
  }

  async findById(id: string) {
    return this.modelTrainingRepository.findOne({ where: { id } });
  }

  public async findAllByTeamId(
    teamId: string,
    dto: ListDto,
  ): Promise<{
    totalCount: number;
    list: ModelTrainingEntity[];
  }> {
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter } = dto;

    const queryBuilder = this.modelTrainingRepository.createQueryBuilder('mt').where('mt.team_id = :teamId', { teamId }).andWhere('mt.is_deleted = false');

    // Apply filtering if provided
    if (filter) {
      if (filter.createdTimestamp && filter.createdTimestamp.length === 2) {
        const [start, end] = filter.createdTimestamp;
        if (start) queryBuilder.andWhere('mt.created_timestamp >= :start', { start });
        if (end) queryBuilder.andWhere('mt.created_timestamp <= :end', { end });
      }
    }

    // Count total number of projects
    const totalCount = await queryBuilder.getCount();

    // Apply ordering
    const validOrderColumns = {
      createdTimestamp: 'mt.created_timestamp',
      updatedTimestamp: 'mt.updated_timestamp',
    };
    const orderColumnSql = validOrderColumns[orderColumn] || 'mt.created_timestamp';

    // Apply pagination
    const modelTrainings = await queryBuilder
      .orderBy(orderColumnSql, orderBy.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();

    return {
      totalCount,
      list: modelTrainings,
    };
  }

  async update(id: string, modelTraining: ModelTrainingEntity) {
    return this.modelTrainingRepository.update(id, modelTraining);
  }

  async delete(id: string) {
    return this.modelTrainingRepository.update(id, { isDeleted: true });
  }
}
