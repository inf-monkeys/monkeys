import { MediaSource, MediaType } from '@/database/entities/assets/media/media-file';
import * as Joiful from 'joiful';

export class CreateRichMediaDto {
  @Joiful.string().required()
  type: MediaType | string; // 支持完整的 mimetype（如 image/jpeg）或简化类型（如 image）

  @Joiful.string()
  displayName: string;

  @Joiful.string()
  url: string;

  @Joiful.number().allow(1, 2, 3, 4)
  source: MediaSource;

  @Joiful.string()
  description?: string;

  @Joiful.object()
  params?: any;

  @Joiful.number()
  size?: number;

  @Joiful.string()
  md5?: string;
}
