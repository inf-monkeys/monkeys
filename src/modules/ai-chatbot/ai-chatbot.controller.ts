import { createOpenAI } from '@ai-sdk/openai';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { convertToModelMessages, streamText } from 'ai';
import { Response } from 'express';
import { AiChatbotService } from './ai-chatbot.service';
import { ChatMessage } from './typings';

@Controller('/ai-chatbot')
export class AiChatbotController {
  constructor(private readonly aiChatbotService: AiChatbotService) {}

  @Post()
  async chat(@Res() res: Response, @Body() body: { message: ChatMessage }) {
    const openai = createOpenAI({});

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToModelMessages([body.message]),
      activeTools: ['getWeather'],
      tools: {
        getWeather: this.aiChatbotService.getWeatherTool,
      },
    });

    result.pipeUIMessageStreamToResponse(res);
  }

  @Post('/tools/getWeather')
  async getWeather(@Res() res: Response, @Body() body: { latitude: number; longitude: number }) {
    const resp = await this.aiChatbotService.getWeather(body.latitude, body.longitude);
    return resp;
  }
}
