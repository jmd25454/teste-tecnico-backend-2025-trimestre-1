export interface IFileStorage {
  save(filename: string, buffer: Buffer): Promise<void>;
  read(filename: string): Promise<Buffer>;
  exists(filename: string): Promise<boolean>;
  delete(filename: string): Promise<void>;
}