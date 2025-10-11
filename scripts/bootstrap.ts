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
  skipData: boolean;
}

function parseOptions(): Options {
  const args = new Set(process.argv.slice(2));
  return {
    forceEnv: args.has('--force-env'),
    skipInstall: args.has('--skip-install'),
    skipData: args.has('--skip-data'),
  };
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function commandExists(command: string) {
  return new Promise<boolean>((resolvePromise) => {
    const check = spawn('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' });
    check.on('close', (code) => resolvePromise(code === 0));
    check.on('error', () => resolvePromise(false));
  });
}

async function ensureEnv(force: boolean) {
  if (existsSync(ENV_PATH) && !force) {
    console.log('✔︎ .env already present');
    return;
  }
  if (!existsSync(ENV_TEMPLATE_PATH)) {
    throw new Error('Missing .env.example');
  }
  copyFileSync(ENV_TEMPLATE_PATH, ENV_PATH);
  console.log(force ? '⚠︎ .env replaced from template' : '✔︎ .env created from template');
}

async function main() {
  const options = parseOptions();
  console.log('➡️  Bootstrapping workspace...');
  await ensureEnv(options.forceEnv);

  if (!(await commandExists('pnpm'))) {
    throw new Error('pnpm is required. Install it via `npm install -g pnpm`.');
  }

  if (!options.skipInstall) {
    console.log('➡️  Installing dependencies...');
    await runCommand('pnpm', ['install']);
  } else {
    console.log('⏭️  Skipping install');
  }

  if (!options.skipData) {
    console.log('➡️  Preparing demo data...');
    await runCommand('pnpm', ['db:migrate']);
    await runCommand('pnpm', ['db:seed']);
    await runCommand('pnpm', ['kb:ingest']);
  } else {
    console.log('⏭️  Skipping data setup');
  }

  console.log('✅ Ready! Run `pnpm dev` to launch the apps.');
}

main().catch((error) => {
  console.error('❌ Bootstrap failed');
  console.error(error);
  process.exit(1);
});

