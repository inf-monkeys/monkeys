import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ComfyUIModule } from './comfyui.module';

export const COMFYUI_TOOL_OPENAPI_PATH = '/api/comfyui';
export const COMFYUI_TOOL_OPENAPI_MENIFEST_URL = `http://127.0.0.1:${config.server.port}/api/comfyui/manifest.json`;

export const setupComfyuiToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('ComfyUI').setDescription('ComfyUI endpoints').setVersion('1.0').addServer(`${config.server.appUrl}`, 'ComfyUI API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [ComfyUIModule],
    deepScanRoutes: false,
  });
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const tags = document.paths[path][method].tags;
      if (tags?.length) {
        for (const tag of tags) {
          if (!document.tags.find((x) => x.name === tag)) {
            document.tags.push({
              name: tag,
              description: '',
            });
          }
        }
      }
    }
  }
  SwaggerModule.setup(COMFYUI_TOOL_OPENAPI_PATH, app, document);
};
