import {
  MonkeyToolCategories,
  MonkeyToolDescription,
  MonkeyToolDisplayName,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '../../../common/typings/tools';
import { AddTwoNumberDto } from './dto/req/add-two-number.dto';
import { NthPowerOfDto } from './dto/req/nth-power-of.dto';
import { EXAMPLE_WORKER_OPENAPI_PATH } from './example.swagger';

@Controller('/example-tool')
@ApiTags('示例计算工具')
export class ExampleToolsController {
  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: '示例工具',
      namespace: 'monkey_tools_example',
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${EXAMPLE_WORKER_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/add-two-number')
  @ApiOperation({
    summary: 'Add Two Numbers',
    description: 'Simply add tow numbers.',
  })
  @MonkeyToolName('add_two_number')
  @MonkeyToolDisplayName('Add Two Numbers')
  @MonkeyToolCategories(['math'])
  @MonkeyToolIcon('emoji:👧:#ceefc5')
  @MonkeyToolInput([
    {
      name: 'numA',
      displayName: 'Number A',
      required: true,
      type: 'number',
    },
    {
      name: 'numB',
      displayName: 'Number B',
      required: true,
      type: 'number',
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: 'Result',
      required: true,
      type: 'number',
    },
  ])
  public async addTwoNumberExample(@Req() req: IRequest, @Body() body: AddTwoNumberDto) {
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
  @MonkeyToolCategories(['math'])
  @MonkeyToolName('nth_power_of')
  @MonkeyToolDisplayName('Calc Nth Power')
  @MonkeyToolDescription('Calc Nth Power, assumes may take a while ...')
  @MonkeyToolIcon('emoji:👧:#ceefc5')
  @MonkeyToolInput([
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
  @MonkeyToolOutput([
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
