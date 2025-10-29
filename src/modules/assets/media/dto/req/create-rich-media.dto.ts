import { MediaSource, MediaType } from '@/database/entities/assets/media/media-file';
import * as Joiful from 'joiful';

export class CreateRichMediaDto {
  @Joiful.string().required().allow('image', 'text', 'dataset')
  type: MediaType;

  @Joiful.string()
  displayName: string;

  @Joiful.string()
  url: string;

  @Joiful.number().allow(1, 2, 3, 4)
  source: MediaSource;

  @Joiful.object()
  params?: any;

  @Joiful.number()
  size?: number;

  @Joiful.string()
  md5?: string;
}
