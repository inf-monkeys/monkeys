export enum MIME_TYPES {
  png = 'image/png',
  gif = 'image/gif',
  jpeg = 'image/jpeg',
  svg = 'image/svg+xml',
  webp = 'image/webp',
  avif = 'image/avif',
  mp4 = 'video/mp4',
  zip = 'application/zip',
  csv = 'text/csv',
  pdf = 'application/pdf',
  doc = 'application/msword',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls = 'application/vnd.ms-excel',
  xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt = 'application/vnd.ms-powerpoint',
  pptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  exe = 'application/vnd.microsoft.portable-executable',
}

export type IMAGE_MIME_TYPE = (
  | 'image/png'
  | 'image/gif'
  | 'image/jpeg'
  | 'image/svg+xml'
  | 'image/webp'
  | 'image/avif'
)[];
export type PDF_MIME_TYPE = 'application/pdf'[];
export type MS_WORD_MIME_TYPE = (
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
)[];
export type MS_EXCEL_MIME_TYPE = (
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)[];
export type MS_POWERPOINT_MIME_TYPE = (
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
)[];
export type EXE_MIME_TYPE = 'application/vnd.microsoft.portable-executable'[];
