import { config } from '@/common/config';
import { Theme } from '@/entities/config/theme';
import { TypeOrmModule } from '@nestjs/typeorm';

export const DatabaseModule = TypeOrmModule.forRoot({
  ...config.database,
  entityPrefix: config.server.appId.concat('-'),
  entities: [Theme],
});
