export function base64toFile(base64String: string, fileName: string) {
  const ary = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!ary) return;
  const [, fileType, base64Data] = ary;
  const byteCharacters = atob(base64Data); // 解码base64数据
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);

  const blob = new Blob([byteArray], { type: fileType });

  return new File([blob], fileName, { type: fileType });
}
