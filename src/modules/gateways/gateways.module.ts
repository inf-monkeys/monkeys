import { Module } from '@nestjs/common';
import { VectorGatewayModule } from './vector/vector.gateway.module';

@Module({
  imports: [VectorGatewayModule],
})
export class GatewaysModule {}
