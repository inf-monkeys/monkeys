import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Controller('designs')
@ApiTags('DesignCRUD')
@UseGuards(CompatibleAuthGuard)
export class DesignController {
  constructor(private readonly designService: DesignService) {}
  @Post()
  @ApiOperation({
    summary: '创建设计',
    description: '创建设计',
  })
  async create(@Req() req: IRequest, @Body() createDesignDto: CreateDesignDto) {
    const { teamId } = req;
    return await this.designService.create({
      ...createDesignDto,
      teamId,
    });
  }

  @Get()
  @ApiOperation({
    summary: '获取设计列表',
    description: '获取设计列表',
  })
  async findAll(@Req() req: IRequest) {
    const { teamId } = req;
    console.log(teamId);
    return await this.designService.findAllbyTeamId(teamId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取设计',
    description: '获取设计',
  })
  async findOne(@Param('id') id: string) {
    return await this.designService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新设计',
  })
  async update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    return await this.designService.update(id, updateDesignDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除设计',
  })
  async remove(@Param('id') id: string) {
    return await this.designService.remove(id);
  }
}
