export const downloadFile = (file: File) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
};
