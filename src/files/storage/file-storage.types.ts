export interface SaveFileInput {
  buffer: Buffer;
  mimeType: string;
  folder: string;
  fileName: string;
}

export interface StoredFile {
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

// Тип загруженного файла из multipart/form-data.
// Держим его отдельным интерфейсом, чтобы сервисы не зависели от конкретной библиотеки.
export interface UploadedBinaryFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}
