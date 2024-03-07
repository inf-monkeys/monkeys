import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserInfoDto {
  @ApiProperty({
    description: 'userId',
    type: String,
    required: true,
  })
  @Expose()
  _id?: string;

  @ApiProperty({
    description: '用户名',
    type: String,
    required: false,
  })
  @Expose()
  name?: string;

  @ApiProperty({
    description: '头像',
    type: String,
    required: true,
  })
  @Expose()
  photo: string;

  @ApiProperty({
    description: '手机号',
    type: String,
    required: false,
  })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: '邮箱',
    type: String,
    required: false,
  })
  @Expose()
  email?: string;
}
