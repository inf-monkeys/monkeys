import { config } from '@/common/config';
import { BlockDefinition, BlockType } from '@inf-monkeys/vines';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiExtension, ApiOperation } from '@nestjs/swagger';
import { ApiType, AuthType, MenifestJson, SchemaVersion } from '../interfaces';
import { AddTwoNumberDto } from './dto/req/add-two-number.dto';
import { NthPowerOfDto } from './dto/req/nth-power-of.dto';
import { EXAMPLE_WORKER_OPENAPI_PATH } from './example.swagger';

@Controller('/worker/example')
export class ExampleController {
  @Get('/.well-known/monkey-plugin.json')
  @ApiExcludeEndpoint()
  public getMetadata(): MenifestJson {
    return {
      schema_version: SchemaVersion.v1,
      namespace: 'monkeys_example_worker',
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `http://127.0.0.1:${config.server.port}${EXAMPLE_WORKER_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/add-two-number')
  @ApiOperation({
    summary: 'Add Two Numbers',
    description: 'Simply add tow numbers.',
  })
  @ApiExtension('x-monkey-block-categories', ['math'])
  public async addTwoNumberExample(@Body() body: AddTwoNumberDto) {
    const { numA, numB } = body;
    return numA + numB;
  }

  @Post('/nth-power-of')
  @ApiOperation({
    summary: 'Calc Nth Power',
    description: 'Calc Nth Power, assumes may take a while ...',
  })
  @ApiExtension('x-monkey-block-categories', ['math'])
  @ApiExtension('x-monkey-block-def', {
    type: BlockType.SIMPLE,
    name: 'Calc Nth Power',
    description: 'Calc Nth Power, assumes may take a while ...',
    input: [
      {
        name: 'num',
        displayName: 'Number',
        required: true,
        type: 'number',
      },
      {
        name: 'n',
        displayName: 'N',
        required: true,
        type: 'number',
      },
    ],
  } as BlockDefinition)
  public async longTimeCalcExample(@Body() body: NthPowerOfDto) {
    const { num, n } = body;
    return Math.pow(num, n);
  }
}
