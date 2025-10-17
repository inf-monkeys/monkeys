import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class GetFeishuTableHeadersDto {
  @ApiProperty({
    description: '飞书表格URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tbl15UTvvmfDTf5C&view=vew5h0JxuR',
  })
  @IsUrl({}, { message: '请输入有效的飞书表格URL' })
  url: string;
}

export class FeishuTableHeadersResponseDto {
  @ApiProperty({
    description: '表格表头列表',
    example: ['编号', '图片', '提示词文本', '图片来源'],
    type: [String],
  })
  headers: string[];
}
