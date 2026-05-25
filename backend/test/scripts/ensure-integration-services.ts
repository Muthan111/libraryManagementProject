import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as path from 'node:path';

const backendDir = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(backendDir, '..');
const composeFile = path.join(repoRoot, 'docker-compose.test.yml');
const envFile = path.join(backendDir, '.env.test');

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function getServiceConfig() {
  const fileEnv = parseEnvFile(envFile);
  const env = { ...fileEnv, ...process.env };

  return {
    dbHost: env.DB_HOST || '127.0.0.1',
    dbPort: Number.parseInt(env.DB_PORT || '3307', 10),
    redisHost: env.REDIS_HOST || '127.0.0.1',
    redisPort: Number.parseInt(env.REDIS_PORT || '6380', 10),
  };
}

function canConnect(
  host: string,
  port: number,
  timeoutMs = 1000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function servicesReady(config: ReturnType<typeof getServiceConfig>) {
  const [dbReady, redisReady] = await Promise.all([
    canConnect(config.dbHost, config.dbPort),
    canConnect(config.redisHost, config.redisPort),
  ]);

  return dbReady && redisReady;
}

function runDockerCompose() {
  const result = spawnSync(
    'docker',
    ['compose', '-f', composeFile, 'up', '-d'],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`docker compose exited with code ${result.status}`);
  }
}

async function waitForServices(
  config: ReturnType<typeof getServiceConfig>,
  attempts = 24,
  delayMs = 2500,
) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await servicesReady(config)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

async function main() {
  const config = getServiceConfig();

  if (await servicesReady(config)) {
    console.log(
      `Integration services are ready on MySQL ${config.dbHost}:${config.dbPort} and Redis ${config.redisHost}:${config.redisPort}.`,
    );
    return;
  }

  if (!fs.existsSync(composeFile)) {
    throw new Error(`Missing integration compose file at ${composeFile}.`);
  }

  console.log('Starting integration test services with Docker Compose...');
  runDockerCompose();

  console.log('Waiting for MySQL and Redis to accept connections...');

  if (!(await waitForServices(config))) {
    throw new Error(
      `Integration services did not become ready on MySQL ${config.dbHost}:${config.dbPort} and Redis ${config.redisHost}:${config.redisPort}.`,
    );
  }

  console.log('Integration services are ready.');
}

main().catch((error: Error) => {
  console.error(
    'Unable to prepare integration test services. Ensure Docker Desktop is running and your account can access the Docker daemon.',
  );
  console.error(error.message);
  process.exit(1);
});
