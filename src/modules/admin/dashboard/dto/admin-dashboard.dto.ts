import { ApiProperty } from '@nestjs/swagger';

export type AdminDashboardTrend = 'up' | 'down' | 'flat';

export class AdminDashboardMetricDto {
  @ApiProperty({ description: '总量' })
  total: number;

  @ApiProperty({ description: '本月新增' })
  monthNew: number;

  @ApiProperty({ description: '上月新增' })
  prevMonthNew: number;

  @ApiProperty({
    description: '本月新增相对上月新增的变化百分比；上月为 0 时为 null',
    nullable: true,
  })
  changePct: number | null;

  @ApiProperty({ description: '趋势' })
  trend: AdminDashboardTrend;
}

export class AdminDashboardStatsDto {
  @ApiProperty({ description: '平台用户统计（users 表，未删除）' })
  users: AdminDashboardMetricDto;

  @ApiProperty({ description: '团队统计（teams 表，未删除）' })
  teams: AdminDashboardMetricDto;

  @ApiProperty({ description: '工具统计（tools 表，未删除）' })
  tools: AdminDashboardMetricDto;

  @ApiProperty({ description: '工作流统计（按 workflow_id 去重，未删除）' })
  workflows: AdminDashboardMetricDto;
}
