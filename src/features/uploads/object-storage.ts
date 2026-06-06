export type ObjectStorageUploadInput = {
  key: string;
  body: Blob | ArrayBuffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
};

export type StoredObject = {
  url: string;
  key: string;
  contentType: string;
  size: number;
};

export type ObjectStorageAdapter = {
  uploadObject(input: ObjectStorageUploadInput): Promise<StoredObject>;
};
