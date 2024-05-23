import axios from 'axios';
import { logger } from '../logger';

export async function downloadFileAsArrayBuffer(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return response.data.buffer;
  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}

export async function downloadFileAsBuffer(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}
