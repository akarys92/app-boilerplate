import { getDatabase } from '@app/db';
import { createId } from '@app/utils';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  delivered: number;
  opened: number;
}

const campaigns: EmailCampaign[] = [
  {
    id: createId('evt'),
    name: 'Welcome Series',
    subject: 'Your AI workspace is ready',
    delivered: 482,
    opened: 401,
  },
  {
    id: createId('evt'),
    name: 'Feature Spotlight',
    subject: 'Voice-first customer support',
    delivered: 311,
    opened: 204,
  },
];

export function listEmailCampaigns(): EmailCampaign[] {
  return [...campaigns];
}

export function sendTransactionalEmail(to: string, template: string, variables: Record<string, string>) {
  const db = getDatabase();
  db.addAuditLog({
    actorId: to,
    action: 'email.sent',
    target: template,
    metadata: variables,
  });

  return {
    id: createId('evt'),
    to,
    template,
    variables,
    previewUrl: `https://email.preview/${template}`,
  };
}

