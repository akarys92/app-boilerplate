import Link from 'next/link';
import { Card, Button, Badge, Metric, Grid, Stack } from '@app/ui';
import { getDashboardSnapshot, getKnowledgeBaseDocuments, getThread } from '@app/api';
import ChatPanel from './components/ChatPanel';

export default async function Page() {
  const dashboard = getDashboardSnapshot();
  const docs = getKnowledgeBaseDocuments();
  const activeThread = dashboard.chatThreads[0];
  const threadDetail = activeThread ? getThread(activeThread.id) : null;

  return (
    <main
      style={{
        padding: '4rem 2rem',
        display: 'grid',
        gap: '2.5rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <header style={{ display: 'grid', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Badge>Full-stack AI starter</Badge>
        </div>
        <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 1.1 }}>
          Ship web, mobile, chat, and voice experiences before lunch.
        </h1>
        <p style={{ maxWidth: 640, margin: '0 auto', fontSize: '1.1rem', color: 'rgba(15,23,42,0.65)' }}>
          Everything runs from configuration: run the bootstrap script, start `pnpm dev`, and explore the fully-wired
          dashboard with auth, payments, analytics, and AI chat.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button href="https://github.com/" target="_blank" rel="noreferrer">
            View docs
          </Button>
          <Button variant="ghost" href="https://vercel.com/" target="_blank" rel="noreferrer">
            Deploy to Vercel
          </Button>
        </div>
      </header>

      <Grid columns={3}>
        <Card
          title="Feature toggles"
          description="Toggle modules without touching code."
          action={<Badge>{Object.values(dashboard.featureFlags).filter(Boolean).length} enabled</Badge>}
        >
          <Stack>
            {Object.entries(dashboard.featureFlags).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
                <strong style={{ color: value ? '#16a34a' : '#f97316' }}>{value ? 'On' : 'Off'}</strong>
              </div>
            ))}
          </Stack>
        </Card>
        <Card
          title="Subscription"
          description={dashboard.subscription ? 'Connected to Stripe demo mode.' : 'Start on the free tier.'}
          action={
            dashboard.subscription ? (
              <span style={{ color: 'rgba(15,23,42,0.65)', fontSize: '0.9rem' }}>
                Renews {dashboard.subscription.renewalDate}
              </span>
            ) : null
          }
        >
          <Stack>
            {dashboard.products.map((plan) => (
              <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{plan.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.65)' }}>{plan.description}</div>
                </div>
                <span style={{ fontWeight: 600 }}>{plan.price}/{plan.interval}</span>
              </div>
            ))}
          </Stack>
        </Card>
        <Card title="Usage" description="Aggregated across the built-in demos.">
          <Grid columns={3}>
            <Metric label="Tokens" value={dashboard.usage.tokensUsed.toLocaleString()} />
            <Metric label="Sessions" value={dashboard.usage.totalSessions.toString()} />
            <Metric label="Latency" value={`${dashboard.usage.avgResponseTimeMs || 0} ms`} />
          </Grid>
        </Card>
      </Grid>

      <Grid columns={2}>
        <Card
          title="Live chat"
          description="Ask the onboarder bot anything about the boilerplate."
          action={
            activeThread ? (
              <span style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.65)' }}>
                {activeThread.messageCount} messages · avg {activeThread.avgMessageLength} chars
              </span>
            ) : null
          }
        >
          {threadDetail ? (
            <ChatPanel threadId={threadDetail.thread.id} initialMessages={threadDetail.messages} />
          ) : (
            <p>No chat threads found. Run `pnpm db:seed` to generate demo data.</p>
          )}
        </Card>

        <Card
          title="Knowledge base"
          description="Ingested markdown becomes vector-ready docs for retrieval augmented generation."
        >
          <Stack>
            {docs.map((doc) => (
              <div key={doc.id} style={{ display: 'grid', gap: '0.35rem' }}>
                <strong>{doc.title}</strong>
                <p style={{ margin: 0, color: 'rgba(15,23,42,0.65)' }}>{doc.excerpt}...</p>
                <span style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.55)' }}>
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!docs.length && (
              <p>
                Add markdown to <code>docs/knowledge-base</code> and run <code>pnpm kb:ingest</code>.
              </p>
            )}
          </Stack>
        </Card>
      </Grid>

      <Grid columns={3}>
        <Card title="Voice sessions" description="Captured transcriptions ready for TTS playback.">
          <Stack>
            {dashboard.voiceSessions.map((session) => (
              <div key={session.id} style={{ display: 'grid', gap: '0.25rem' }}>
                <strong>{session.title}</strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.65)' }}>
                  {Math.max(session.durationSeconds, 1)}s · {new Date(session.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {!dashboard.voiceSessions.length && <p>No voice sessions yet. Trigger via the voice SDK.</p>}
          </Stack>
        </Card>
        <Card title="Email campaigns" description="React Email templates rendered via Resend.">
          <Stack>
            {dashboard.emailCampaigns.map((campaign) => (
              <div key={campaign.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{campaign.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.65)' }}>{campaign.subject}</div>
                </div>
                <span style={{ fontWeight: 600 }}>{Math.round((campaign.opened / campaign.delivered) * 100)}% open</span>
              </div>
            ))}
          </Stack>
        </Card>
        <Card title="Audit & analytics" description="Every action is persisted for review.">
          <Stack>
            {dashboard.analytics.map((event) => (
              <div key={event.id} style={{ display: 'grid', gap: '0.25rem' }}>
                <strong>{event.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.65)' }}>
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {!dashboard.analytics.length && <p>No analytics events recorded yet.</p>}
          </Stack>
        </Card>
      </Grid>

      <footer style={{ textAlign: 'center', color: 'rgba(15,23,42,0.55)' }}>
        Built for hacking fast. View the <Link href="/api/chat">chat API</Link> or edit feature flags in <code>.env</code>.
      </footer>
    </main>
  );
}

