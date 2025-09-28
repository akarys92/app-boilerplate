import { getConfig, isFeatureEnabled } from '@app/config';
import { getDatabase } from '@app/db';
import { formatCurrency, average } from '@app/utils';
import { getPricingTable, getSubscriptionForUser } from '@app/payments';
import { getUsageStatistics } from '@app/llm';
import { getRecentMessages } from '@app/chat';
import { listVoiceSessions } from '@app/voice';
import { listEmailCampaigns } from '@app/email';
import { listAnalyticsEvents } from '@app/analytics';

export interface DashboardSnapshot {
  featureFlags: Record<string, boolean>;
  profile: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  subscription: {
    productName: string;
    status: string;
    renewalDate: string;
  } | null;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    interval: string;
  }>;
  chatThreads: Array<{
    id: string;
    title: string;
    messageCount: number;
    lastMessage?: string;
    avgMessageLength: number;
  }>;
  usage: {
    tokensUsed: number;
    avgResponseTimeMs: number;
    totalSessions: number;
  };
  voiceSessions: ReturnType<typeof listVoiceSessions>;
  analytics: ReturnType<typeof listAnalyticsEvents>;
  emailCampaigns: ReturnType<typeof listEmailCampaigns>;
}

export function getDashboardSnapshot(): DashboardSnapshot {
  const config = getConfig();
  const db = getDatabase();
  const user = db
    .getUsers()
    .find((candidate) => candidate.email === config.defaultUserEmail) ?? db.getUsers()[0];

  const subscription = user ? getSubscriptionForUser(user.id) : null;

  return {
    featureFlags: {
      auth: isFeatureEnabled('auth'),
      payments: isFeatureEnabled('payments'),
      chat: isFeatureEnabled('chat'),
      voice: isFeatureEnabled('voice'),
      analytics: isFeatureEnabled('analytics'),
      emails: isFeatureEnabled('emails'),
    },
    profile: {
      name: user?.name ?? 'Demo User',
      email: user?.email ?? 'demo@example.com',
      role: user?.role ?? 'user',
      avatarUrl: user?.avatarUrl,
    },
    subscription: subscription
      ? {
          productName: subscription.product.name,
          status: subscription.subscription.status,
          renewalDate: new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString(),
        }
      : null,
    products: getPricingTable().map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: formatCurrency(product.priceCents),
      interval: product.interval,
    })),
    chatThreads: db.getThreads().map((thread) => {
      const messages = db.getMessages(thread.id);
      const lastMessage = messages[messages.length - 1];
      const lengths = messages.map((message) => message.content.length);
      return {
        id: thread.id,
        title: thread.title,
        messageCount: messages.length,
        lastMessage: lastMessage?.content,
        avgMessageLength: Math.round(average(lengths)),
      };
    }),
    usage: getUsageStatistics(),
    voiceSessions: listVoiceSessions(),
    analytics: listAnalyticsEvents(),
    emailCampaigns: listEmailCampaigns(),
  };
}

export function getKnowledgeBaseDocuments() {
  const db = getDatabase();
  return db.getKnowledgeBase().map((doc) => ({
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.body.slice(0, 180),
    updatedAt: doc.updatedAt,
  }));
}

export function getThread(threadId: string) {
  const db = getDatabase();
  const thread = db.getThreads().find((candidate) => candidate.id === threadId);
  if (!thread) {
    return null;
  }
  return {
    thread,
    messages: getRecentMessages(threadId, 50),
  };
}

