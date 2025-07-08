import { Injectable } from '@nestjs/common';
import { tool } from 'ai';
import axios from 'axios';
import z from 'zod';

@Injectable()
export class AiChatbotService {
  public async getWeather(latitude: number, longitude: number) {
    const resp = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`);

    return resp.data;
  }

  public getWeatherTool = tool({
    description: 'Get the weather at a location',
    inputSchema: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    execute: async ({ latitude, longitude }) => {
      const resp = await this.getWeather(latitude, longitude);
      return resp;
    },
  });
}
