import { config } from '@/common/config';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiExtension, ApiOperation } from '@nestjs/swagger';
import { ApiType, AuthType, MenifestJson, SchemaVersion } from '../interfaces';
import { AddTwoNumberDto } from './dto/req/add-two-number.dto';
import { NthPowerOfDto } from './dto/req/nth-power-of.dto';
import { EXAMPLE_WORKER_OPENAPI_PATH } from './example.swagger';

@Controller('/worker/example')
export class ExampleController {
  @Get('/menifest.json')
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
    return {
      result: numA + numB,
    };
  }

  @Post('/nth-power-of')
  @ApiOperation({
    summary: 'Calc Nth Power',
    description: 'Calc Nth Power, assumes may take a while ...',
  })
  @ApiExtension('x-monkey-block-categories', ['math'])
  @ApiExtension('x-monkey-block-displayName', 'Calc Nth Power')
  @ApiExtension('x-monkey-block-description', 'Calc Nth Power, assumes may take a while ...')
  @ApiExtension('x-monkey-block-icon', 'emoji:👧:#ceefc5')
  @ApiExtension('x-monkey-block-input', [
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
  ])
  @ApiExtension('x-monkey-block-output', [
    {
      name: 'result',
      displayName: 'Result',
      required: true,
      type: 'number',
    },
  ])
  public async longTimeCalcExample(@Body() body: NthPowerOfDto) {
    const { num, n } = body;
    return {
      result: Math.pow(num, n),
    };
  }
}
