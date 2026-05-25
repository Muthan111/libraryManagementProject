import { existsSync } from 'fs';
import { resolve } from 'path';

export function getEnvFilePaths(cwd = process.cwd()): string[] {
  const env = process.env.NODE_ENV?.trim();
  const candidates = env ? [`.env.${env}`, '.env'] : ['.env'];

  return candidates
    .map((fileName) => resolve(cwd, fileName))
    .filter((filePath, index, values) => {
      return values.indexOf(filePath) === index && existsSync(filePath);
    });
}
