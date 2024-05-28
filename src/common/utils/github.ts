import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

export async function getGithubSubdirectories(repoUrl: string): Promise<string[]> {
  const parts = repoUrl.split('/');
  const owner = parts[3];
  const repo = parts[4];
  const branch = parts[6];
  const dirPath = parts.slice(7).join('/');

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

  try {
    const response = await axios.get<GitHubContent[]>(apiUrl, {
      headers: {
        Authorization: config.comfyui.githubToken ? `Bearer ${config.comfyui.githubToken}` : undefined,
      },
    });
    const contents = response.data;

    const subdirectories = contents.filter((item) => item.type === 'dir').map((item) => item.name);

    return subdirectories;
  } catch (error) {
    console.error(`Error: Unable to fetch contents from ${apiUrl}`, error.message);
    return [];
  }
}

export async function downloadGitHubDirectory(repoUrl: string, outputDir: string): Promise<void> {
  const parts = repoUrl.split('/');
  const owner = parts[3];
  const repo = parts[4];
  const branch = parts[6];
  const dirPath = parts.slice(7).join('/');

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

  try {
    const response = await axios.get<GitHubContent[]>(apiUrl, {
      headers: {
        Authorization: config.comfyui.githubToken ? `Bearer ${config.comfyui.githubToken}` : undefined,
      },
    });
    const contents = response.data;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const item of contents) {
      const itemPath = path.join(outputDir, item.name);
      if (item.type === 'file') {
        await downloadGithubFile(item.download_url, itemPath);
      } else if (item.type === 'dir') {
        await downloadGitHubDirectory(item.html_url, itemPath);
      }
    }
  } catch (error) {
    console.error(`Error: Unable to fetch contents from ${apiUrl}`, error.message);
  }
}

async function downloadGithubFile(url: string, outputPath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
