import { ComfyuiPrompt, ComfyuiWorkflow, ComfyuiWorkflowWithPrompt } from '../typings/comfyui';
import { downloadFileAsArrayBuffer, downloadFileAsBuffer } from './image';

export const readComfyuiWorkflowFromImage = async (imageUrl: string): Promise<ComfyuiWorkflowWithPrompt> => {
  const buffer = await downloadFileAsArrayBuffer(imageUrl);
  const dataView = new DataView(buffer);

  // Check that the PNG signature is present
  if (dataView.getUint32(0) !== 0x89504e47) {
    throw new Error('Not a valid PNG file');
  }

  const pngData = new Uint8Array(buffer);
  // Start searching for chunks after the PNG signature
  let offset = 8;
  const txt_chunks: { [x: string]: string } = {};
  // Loop through the chunks in the PNG file
  while (offset < pngData.length) {
    // Get the length of the chunk
    const length = dataView.getUint32(offset);
    // Get the chunk type
    const type = String.fromCharCode(...pngData.slice(offset + 4, offset + 8));
    if (type === 'tEXt' || type == 'comf') {
      // Get the keyword
      let keyword_end = offset + 8;
      while (pngData[keyword_end] !== 0) {
        keyword_end++;
      }
      const keyword = String.fromCharCode(...pngData.slice(offset + 8, keyword_end));
      // Get the text
      const contentArraySegment = pngData.slice(keyword_end + 1, offset + 8 + length);
      const contentJson = Array.from(contentArraySegment)
        .map((s) => String.fromCharCode(s))
        .join('');
      txt_chunks[keyword] = contentJson;
    }

    offset += 12 + length;
  }

  const { prompt, workflow } = txt_chunks;
  return {
    workflow: JSON.parse(workflow),
    prompt: JSON.parse(prompt),
  };
};

export const readComfyuiWorkflowFromJsonFile = async (jsonUrl: string): Promise<ComfyuiWorkflow> => {
  const buffer = await downloadFileAsBuffer(jsonUrl);
  const str = buffer.toString(); // 将Buffer转换为字符串
  // 步骤2: 将字符串解析为JSON
  // 注意：这里假设str是有效的JSON格式字符串，实际应用中应确保字符串格式正确
  let json: ComfyuiWorkflow;
  try {
    json = JSON.parse(str);
  } catch (e) {
    throw new Error('不合法的 JSON 文件');
  }
  if (!json.nodes) {
    throw new Error('不合法的 comfyui workflow json 文件');
  }
  if (!json.links) {
    throw new Error('不合法的 comfyui workflow json 文件');
  }
  return json;
};

export const readComfyuiWorkflowPromptFromJsonFile = async (jsonUrl: string): Promise<ComfyuiPrompt> => {
  const buffer = await downloadFileAsBuffer(jsonUrl);
  const str = buffer.toString(); // 将Buffer转换为字符串
  let json: ComfyuiPrompt;
  try {
    json = JSON.parse(str);
  } catch (e) {
    throw new Error('不合法的 JSON 文件');
  }
  if (typeof json !== 'object') {
    throw new Error('不合法的 comfyui api json 文件');
  }

  return json;
};
