import type { CSSProperties, ReactNode } from 'react';

const surfaceStyle: CSSProperties = {
  borderRadius: '16px',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
};

export function Card({
  title,
  description,
  action,
  children,
  footer,
  style,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        ...surfaceStyle,
        ...style,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
          {description ? (
            <p style={{ margin: 0, color: 'rgba(15,23,42,0.65)', fontSize: '0.95rem' }}>{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      <div style={{ display: 'grid', gap: '1rem' }}>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  href,
  target,
  rel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  type?: 'button' | 'submit';
  href?: string;
  target?: string;
  rel?: string;
}) {
  const base: CSSProperties = {
    borderRadius: '999px',
    padding: '0.55rem 1.2rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const variants: Record<typeof variant, CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      color: '#fff',
      boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
    },
    ghost: {
      background: 'rgba(148, 163, 184, 0.08)',
      color: '#0f172a',
      boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.3)',
    },
  };

  if (href) {
    return (
      <a href={href} target={target} rel={rel} style={{ ...base, ...variants[variant], display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: 'rgba(37, 99, 235, 0.08)',
        color: '#2563eb',
      }}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ color: 'rgba(15,23,42,0.65)', fontSize: '0.85rem' }}>{label}</span>
      <strong style={{ fontSize: '1.65rem', color: '#0f172a', fontWeight: 700 }}>{value}</strong>
      {delta ? <small style={{ color: '#22c55e', fontWeight: 600 }}>{delta}</small> : null}
    </div>
  );
}

export function Grid({ children, columns = 2 }: { children: ReactNode; columns?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export function Stack({ children, gap = '1.5rem' }: { children: ReactNode; gap?: string }) {
  return (
    <div style={{ display: 'grid', gap }}>{children}</div>
  );
}

