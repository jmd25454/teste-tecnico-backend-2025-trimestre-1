import redis from "../cache/redisClient";
import { IFileStorage } from "../types/IFileStorage";
import { FileSystemAdapter } from "../adapters/fileSystemAdapter";

const CACHE_TTL_SECONDS = 60;
const storage: IFileStorage = new FileSystemAdapter();
const makeCacheKey = (filename: string) => `video:${filename}`;

export async function saveVideo(
  filename: string,
  buffer: Buffer
): Promise<void> {
  await redis.set(makeCacheKey(filename), buffer, "EX", CACHE_TTL_SECONDS);
  await storage.save(filename, buffer);
}

export async function getVideo(filename: string): Promise<Buffer | null> {
  const cached = await redis.getBuffer(makeCacheKey(filename));
  if (cached) return cached;

  const exists = await storage.exists(filename);
  if (!exists) return null;

  const file = await storage.read(filename);

  await redis.set(makeCacheKey(filename), file, "EX", 60);
  return file;
}

export async function videoExists(filename: string): Promise<boolean> {
  if (await redis.exists(makeCacheKey(filename))) return true;

  return storage.exists(filename);
}
