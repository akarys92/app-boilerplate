#!/usr/bin/env node
import { copyFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const ENV_PATH = resolve(ROOT_DIR, '.env');
const ENV_TEMPLATE_PATH = resolve(ROOT_DIR, '.env.example');

interface Options {
  forceEnv: boolean;
  skipInstall: boolean;
  skipDocker: boolean;
  skipDb: boolean;
}

function parseOptions(): Options {
  const args = new Set(process.argv.slice(2));
  return {
    forceEnv: args.has('--force-env'),
    skipInstall: args.has('--skip-install'),
    skipDocker: args.has('--skip-docker'),
    skipDb: args.has('--skip-db'),
  };
}

function runCommand(command: string, args: string[], options: { cwd?: string } = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT_DIR,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function commandExists(command: string) {
  return new Promise<boolean>((resolve) => {
    const check = spawn('sh', ['-c', `command -v ${command}`], {
      stdio: 'ignore',
    });

    check.on('close', (code) => {
      resolve(code === 0);
    });

    check.on('error', () => resolve(false));
  });
}

async function ensureEnvFile(force: boolean) {
  const envExists = existsSync(ENV_PATH);
  if (envExists && !force) {
    console.log('✔︎ .env file already present.');
    return;
  }

  if (!existsSync(ENV_TEMPLATE_PATH)) {
    throw new Error('Missing .env.example template file.');
  }

  copyFileSync(ENV_TEMPLATE_PATH, ENV_PATH);
  console.log(force ? '⚠︎ .env file replaced from template.' : '✔︎ .env file created from template.');
}

async function ensureDockerComposeBinary() {
  try {
    await runCommand('docker', ['compose', 'version']);
    return { command: 'docker', args: ['compose'] as const };
  } catch {
    try {
      await runCommand('docker-compose', ['version']);
      return { command: 'docker-compose', args: [] as const };
    } catch {
      throw new Error('Docker Compose is required. Install Docker Desktop or docker-compose.');
    }
  }
}

async function waitForDatabase() {
  const hasPgIsReady = await commandExists('pg_isready');
  if (!hasPgIsReady) {
    console.log('ℹ️  pg_isready not available, skipping readiness check.');
    return;
  }

  const start = Date.now();
  const timeoutMs = 60_000;
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  while (Date.now() - start < timeoutMs) {
    try {
      await runCommand('pg_isready', ['-h', 'localhost', '-p', '5432']);
      console.log('✔︎ Postgres is ready.');
      return;
    } catch {
      await delay(1500);
    }
  }

  console.warn('⚠︎ Timed out waiting for Postgres to accept connections. Continuing anyway.');
}

async function main() {
  const options = parseOptions();

  console.log('➡️  Bootstrapping development environment...');
  await ensureEnvFile(options.forceEnv);

  const hasPnpm = await commandExists('pnpm');
  if (!hasPnpm) {
    throw new Error('pnpm is required. Install it via `npm install -g pnpm`.');
  }

  if (!options.skipInstall) {
    console.log('➡️  Installing workspace dependencies with pnpm...');
    await runCommand('pnpm', ['install']);
  } else {
    console.log('⏭️  Skipping pnpm install (per flag).');
  }

  if (!options.skipDocker && existsSync(resolve(ROOT_DIR, 'docker-compose.yml'))) {
    const compose = await ensureDockerComposeBinary();
    console.log('➡️  Starting docker services (Postgres, Redis)...');
    await runCommand(compose.command, [...compose.args, 'up', '-d']);
    await waitForDatabase();
  } else if (options.skipDocker) {
    console.log('⏭️  Skipping docker startup (per flag).');
  } else {
    console.log('ℹ️  docker-compose.yml not found. Skipping docker startup.');
  }

  if (!options.skipDb) {
    console.log('➡️  Running database migrations...');
    await runCommand('pnpm', ['db:migrate']);
    console.log('➡️  Seeding database with demo data...');
    await runCommand('pnpm', ['db:seed']);
  } else {
    console.log('⏭️  Skipping database setup (per flag).');
  }

  console.log('✅ Development environment ready!');
  console.log('   • Run `pnpm dev` to start all apps.');
  console.log('   • Run `pnpm --filter apps/web dev` to develop the web app only.');
}

main().catch((error) => {
  console.error('\n❌ Bootstrap failed:', error.message);
  process.exit(1);
});
