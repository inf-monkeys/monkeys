export function countTokens(input: string) {
  // 使用正则表达式匹配所有单词
  const tokens = input.match(/\b\w+\b/g);
  // 如果没有匹配到任何 token，返回 0
  if (!tokens) {
    return 0;
  }
  // 返回 token 的数量
  return tokens.length;
}
