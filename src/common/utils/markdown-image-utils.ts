import * as crypto from 'crypto'; // Import the crypto module
import { logger } from '../logger';

// markdown-image-utils.ts

// 检测文本是否为markdown格式
export function isMarkdown(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 检查常见的Markdown特征
  const markdownPatterns = [
    /^#\s+.+$/m, // 标题
    /\*\*.+\*\*/, // 粗体
    /\*.+\*/, // 斜体
    /!\[.+\]\(.+\)/, // 图片
    /\[.+\]\(.+\)/, // 链接
    /^\s*[-*+]\s+.+$/m, // 无序列表
    /^\s*\d+\.\s+.+$/m, // 有序列表
    /^>\s+.+$/m, // 引用
    /`{1,3}[\s\S]*?`{1,3}/, // 代码块或行内代码
    /^\s*---+\s*$/m, // 分隔线
    /\|\s*[-:]+\s*\|/, // 表格
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

/**
 * Parses the destination string of a markdown link/image (the content within parentheses).
 * It separates the URL from an optional title.
 * e.g., "http://example.com/image.png" -> { url: "http://example.com/image.png" }
 * e.g., "http://example.com/image.png 'My Title'" -> { url: "http://example.com/image.png", title: " 'My Title'" }
 * @param destinationString The content within the parentheses of a markdown link/image.
 * @returns An object with the extracted url and an optional title string (including leading space and quotes).
 */
function parseMarkdownLinkDestination(destinationString: string): { url: string; title?: string } {
  let url = destinationString;
  let title: string | undefined = undefined;

  // Regex to separate URL from title:
  // - ^([^\s]+)             : Captures the URL (group 1), which is one or more non-whitespace characters.
  // - (?:\s+(['"])(.*?)\2)? : Optionally captures the title part:
  //   - \s+                  : Matches one or more leading spaces for the title.
  //   - (['"])              : Captures the opening quote (group 2).
  //   - (.*?)                : Captures the title text itself (group 3), non-greedy.
  //   - \2                   : Matches the closing quote, same as the opening one.
  const titleMatch = destinationString.match(/^([^\s]+)(?:\s+(['"])(.*?)\2)?$/);

  if (titleMatch) {
    url = titleMatch[1]; // The URL part
    if (titleMatch[3] !== undefined) {
      // If group 3 (title text) was matched
      // Reconstruct the title string as it appeared (e.g., " 'My Title'")
      title = destinationString.substring(url.length);
    }
  }
  return { url, title };
}

/**
 * Step 1: Extracts all unique image URLs from a markdown string.
 * Only considers markdown image syntax: ![alt](url "title") or ![alt](url).
 *
 * @param markdown The markdown string to parse.
 * @returns An array of unique image URLs found in the markdown.
 */
export function extractMarkdownImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  // Regex to find markdown images: ![alt text](destination)
  // - !\[(.*?)\] : Captures alt text (non-greedy) in group 1.
  // - \((.*?)\)  : Captures the destination (URL + optional title) in group 2 (non-greedy).
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const destinationString = match[2]; // Content within parentheses, e.g., "url" or "url 'title'"
    const { url } = parseMarkdownLinkDestination(destinationString);
    if (url) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

/**
 * Step 3: Replaces image URLs in a markdown string based on a replacement map.
 * Only considers markdown image syntax: ![alt](url "title") or ![alt](url).
 *
 * @param markdown The markdown string to process.
 * @param urlReplacementMap A Map where keys are original URLs and values are new URLs.
 * @returns The markdown string with image URLs replaced.
 */
export function replaceMarkdownImageUrls(markdown: string, urlReplacementMap: Map<string, string>): string {
  if (!markdown || typeof markdown !== 'string' || !urlReplacementMap || urlReplacementMap.size === 0) {
    return markdown;
  }

  // Regex to find markdown images: ![alt text](destination)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

  return markdown.replace(imageRegex, (fullMatch, altText, destinationString) => {
    const { url: originalUrl, title } = parseMarkdownLinkDestination(destinationString);
    const newUrl = urlReplacementMap.get(originalUrl);

    if (newUrl) {
      // Reconstruct the image with the new URL, preserving alt text and title
      return `![${altText}](${newUrl}${title || ''})`;
    }

    // If no replacement is found for this URL, return the original match
    return fullMatch;
  });
}

// --- Example Usage ---
/*
const markdownContent = `
Hello! This is a test.
![An image](http://example.com/old_image.png "Nice Old Pic")
Here is another one: ![Another](http://example.com/another_old.jpg)
And one without a title: ![No Title](http://example.com/no_title.gif)
This one should not change: ![Unchanged](http://example.com/keep_this.jpeg "Keep Me")
A link that is not an image: [click here](http://example.com/page)
`;

// Step 1: Extract URLs
const extractedUrls = extractMarkdownImageUrls(markdownContent);
console.log("Extracted URLs:", extractedUrls);
// Expected:
// [
//   "http://example.com/old_image.png",
//   "http://example.com/another_old.jpg",
//   "http://example.com/no_title.gif",
//   "http://example.com/keep_this.jpeg"
// ]

// Step 2: (Caching and getting optimized links - done externally)
// For example, you might get this map from your caching/optimization service:
const replacements = new Map<string, string>([
  ["http://example.com/old_image.png", "http://cdn.com/new_image_optimized.webp"],
  ["http://example.com/another_old.jpg", "http://cdn.com/another_new_optimized.webp"],
  ["http://example.com/no_title.gif", "http://cdn.com/no_title_optimized.webp"],
  // Note: "http://example.com/keep_this.jpeg" is not in the map, so it won't be replaced.
]);

// Step 3: Replace URLs
const updatedMarkdown = replaceMarkdownImageUrls(markdownContent, replacements);
console.log("\nUpdated Markdown:");
console.log(updatedMarkdown);
// Expected output:
// Hello! This is a test.
// ![An image](http://cdn.com/new_image_optimized.webp "Nice Old Pic")
// Here is another one: ![Another](http://cdn.com/another_new_optimized.webp)
// And one without a title: ![No Title](http://cdn.com/no_title_optimized.webp)
// This one should not change: ![Unchanged](http://example.com/keep_this.jpeg "Keep Me")
// A link that is not an image: [click here](http://example.com/page)
*/

export async function calculateMd5FromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string | null> {
  try {
    // 2. Convert the ArrayBuffer to a Node.js Buffer
    // The crypto module works easily with Buffers
    const buffer = Buffer.from(arrayBuffer);

    // 3. Create an MD5 hash object
    const hash = crypto.createHash('md5');

    // 4. Update the hash with the buffer data
    hash.update(buffer);

    // 5. Get the final hash as a hexadecimal string
    const md5Hash = hash.digest('hex');
    return md5Hash;
  } catch (error) {
    logger.error(`Error calculating MD5:`, error.message);
    return null;
  }
}
