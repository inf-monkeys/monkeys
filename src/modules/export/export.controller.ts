import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { generateDbId } from '@/common/utils';
import { extractAssetFromZip, generateZip } from '@/common/utils/zip-asset';
import { Body, Controller, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import fs from 'fs';
import { ExportTeamDto } from './dto/export-team.dto';
import { ImportTeamDto } from './dto/import-team.dto';
import { ExportService } from './export.service';

@Controller('')
@UseGuards(CompatibleAuthGuard)
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('/tenant-assets/export')
  async exportData(@Req() req: IRequest, @Param('teamId') teamId: string, @Res() res: Response, @Body() dto: ExportTeamDto) {
    const { teamInfo, workflows, sqlDatabases, richMedias, vectorDatabases, sdModels, llmModels } = await this.service.exportTeamData(req, dto);

    const zipContent = await generateZip({
      teamInfo,
      workflows,
      tableCollections: sqlDatabases,
      richMedias,
      textCollections: vectorDatabases,
      sdModels,
      llmModels,
    });
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(teamInfo.name)}.zip`,
    });

    res.send(zipContent);
  }

  @Post('/tenant-assets/import')
  async importTeam(@Req() req: IRequest, @Body() dto: ImportTeamDto) {
    const { userId } = req;
    const { zipUrl } = dto;

    const { tmpFolder, teamJson, workflows, llmModels, sdModels, textCollections, tableCollections, richMedias } = await extractAssetFromZip(zipUrl);
    // 导入团队基本信息
    if (!teamJson) {
      throw new Error('不合法的 zip 文件，不包含 team.json');
    }
    // let { name } = teamJson;
    // const nameConficts = await this.teamService.checkNameConflict(userId, teamJson.name);
    // if (nameConficts) {
    //   name = name + '-' + generateRandomString(8);
    // }
    // const teamId = await this.teamService.createTeam(userId, name, teamJson.description, teamJson.logoUrl, false, teamJson.workflowTaskNamePrefix, 'import');

    // TODO: fix me
    const teamId = generateDbId();
    try {
      await this.service.importTeamData(teamId, userId, {
        workflows,
        tableCollections,
        richMedias,
        textCollections,
        sdModels,
        llmModels,
      });
    } catch (error) {
      // await this.teamService.deleteTeam(userId, teamId);
      throw error;
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

    return {
      teamId,
    };
  }
}
