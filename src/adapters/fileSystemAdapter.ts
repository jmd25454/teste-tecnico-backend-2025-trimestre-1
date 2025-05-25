import { promises as fs } from 'fs';
import path from 'path';
import { IFileStorage } from '../types/IFileStorage';

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export class FileSystemAdapter implements IFileStorage {
  async save(filename: string, buffer: Buffer): Promise<void> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filePath, buffer);
  }

  async read(filename: string): Promise<Buffer> {
    const filePath = path.join(UPLOAD_DIR, filename);
    return fs.readFile(filePath);
  }

  async exists(filename: string): Promise<boolean> {
    const filePath = path.join(UPLOAD_DIR, filename);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filePath).catch(() => {});
  }
}
