// 提取依赖项的函数
export function extractDependencies(sourceCode: string) {
  // 使用正则表达式匹配 require 函数的调用
  const requireRegex = /require\(['"](.+?)['"]\)/g;

  const dependencies = [];
  let match;

  // 循环匹配所有 require 函数的调用
  while ((match = requireRegex.exec(sourceCode)) !== null) {
    const dependency = match[1];
    dependencies.push(dependency);
  }

  return dependencies;
}
