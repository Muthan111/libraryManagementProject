import { config as loadEnv } from 'dotenv';
import { createClient } from 'redis';
import { getEnvFilePaths } from './env-paths';

for (const envFilePath of getEnvFilePaths()) {
  loadEnv({ path: envFilePath, override: false });
}

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number.parseInt(process.env.REDIS_PORT || '6379', 10);

if (Number.isNaN(redisPort) || redisPort < 0 || redisPort > 65535) {
  throw new Error(
    `Invalid REDIS_PORT value "${process.env.REDIS_PORT}". Expected a number between 0 and 65535.`,
  );
}

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export async function connectRedis() {
  if (redisClient.isOpen) {
    return redisClient;
  }

  await redisClient.connect();
  console.log('Connected to Redis');
  return redisClient;
}

export async function disconnectRedis() {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.quit();
}

export async function resetRedis() {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.flushDb();
}
