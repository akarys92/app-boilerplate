#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { initializeDatabase, getDatabase } from '@app/db';
import { ensureDemoUser } from '@app/auth';
import { createId, formatCurrency } from '@app/utils';
import { getConfig } from '@app/config';
import { trackEvent } from '@app/analytics';
import { transcribeAudio } from '@app/voice';
import { sendTransactionalEmail } from '@app/email';

async function seed() {
  console.log('➡️  Seeding demo data...');
  initializeDatabase();
  ensureDemoUser();
  const db = getDatabase();
  const config = getConfig();

  const founder = db
    .getUsers()
    .find((user) => user.email === config.defaultUserEmail);

  if (!founder) {
    throw new Error('Demo user missing after initialization.');
  }

  console.log('   • Ensuring pricing plans');
  const starter = db.upsertProduct({
    name: 'Starter',
    description: 'Launch with authentication, chat, and payments in minutes.',
    priceCents: 2900,
    interval: 'month',
  });
  const pro = db.upsertProduct({
    name: 'Pro',
    description: 'Unlock voice, analytics, and advanced workflows.',
    priceCents: 9900,
    interval: 'month',
  });

  console.log('   • Assigning subscription to demo user');
  db.upsertSubscription({
    userId: founder.id,
    productId: pro.id,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString(),
  });

  console.log('   • Bootstrapping welcome chat thread');
  const thread = db.upsertThread({
    title: 'Welcome to the AI boilerplate',
    ownerId: founder.id,
    createdAt: new Date().toISOString(),
  });

  const existingMessages = db.getMessages(thread.id);
  if (!existingMessages.length) {
    db.addMessage({
      threadId: thread.id,
      role: 'system',
      content: 'You are a friendly AI onboarding specialist for the boilerplate.',
    });
    db.addMessage({
      threadId: thread.id,
      role: 'user',
      content: 'Give me a tour of what this starter kit unlocks.',
    });
    db.addMessage({
      threadId: thread.id,
      role: 'assistant',
      content:
        'Welcome aboard! Explore the live dashboard to try chat, payments, analytics, and voice without writing any code.',
    });
  }

  console.log('   • Recording audit log entries');
  db.addAuditLog({
    actorId: founder.id,
    action: 'user.login',
    target: founder.email,
    metadata: { via: 'seed-script' },
  });
  db.addAuditLog({
    actorId: founder.id,
    action: 'subscription.activated',
    target: pro.id,
    metadata: { amount: formatCurrency(pro.priceCents) },
  });

  console.log('   • Tracking analytics events');
  trackEvent({ name: 'dashboard_viewed', payload: { plan: pro.name }, userId: founder.id });
  trackEvent({ name: 'chat_started', payload: { threadId: thread.id }, userId: founder.id });
  trackEvent({ name: 'voice_preview_played', payload: { sessionId: createId('evt') }, userId: founder.id });

  console.log('   • Creating sample voice session');
  transcribeAudio(Buffer.from('Voice session summary for the AI boilerplate.'));

  console.log('   • Sending welcome email preview');
  sendTransactionalEmail(founder.email, 'welcome-email', {
    plan: pro.name,
    price: formatCurrency(pro.priceCents),
  });

  console.log('✔︎ Demo data ready.');
}

seed().catch((error) => {
  console.error('❌ Failed to seed demo data');
  console.error(error);
  process.exit(1);
});

