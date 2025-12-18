import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardStatsDto {
  @ApiProperty({ description: '平台用户总数（users 表，未删除）' })
  users: number;

  @ApiProperty({ description: '团队总数（teams 表，未删除）' })
  teams: number;

  @ApiProperty({ description: '工具总数（tools 表，未删除）' })
  tools: number;

  @ApiProperty({ description: '工作流总数（按 workflow_id 去重，未删除）' })
  workflows: number;
}

