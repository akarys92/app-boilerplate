#!/usr/bin/env node
import { initializeDatabase } from '@app/db';
import { ensureDemoUser } from '@app/auth';

async function main() {
  console.log('➡️  Preparing lightweight demo datastore...');
  initializeDatabase();
  ensureDemoUser();
  console.log('✔︎ Datastore ready.');
}

main().catch((error) => {
  console.error('❌ Failed to initialize datastore');
  console.error(error);
  process.exit(1);
});

