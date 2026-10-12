'use client';

import { useState } from 'react';
import { NouveauCorners } from '@/components/Ornaments';

type Status = { kind: 'idle' | 'sending' | 'sent' | 'error'; message?: string };

export function SuggestForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        setStatus({ kind: 'sent' });
      } else setStatus({ kind: 'error', message: body.error ?? 'Something went wrong. Please try again later.' });
    } catch {
      setStatus({ kind: 'error', message: 'Could not reach the server. Check your connection and try again.' });
    }
  }

  if (status.kind === 'sent')
    return (
      <div role="status" className="rounded-[18px] bg-chip-leaf p-6 text-lede">
        <p className="font-bold">Thank you! Your suggestion is in the review queue.</p>
        <p className="mt-2 text-copy">
          <button type="button" className="font-bold text-sky underline" onClick={() => setStatus({ kind: 'idle' })}>
            Suggest another
          </button>
        </p>
      </div>
    );

  const field = 'min-h-12 w-full rounded-xl border-2 border-line-strong bg-input px-3.5 text-copy text-ink';
  return (
    <form onSubmit={onSubmit} className="nouveau relative flex flex-col gap-5 rounded-[24px] border border-line bg-card px-6 pb-7 pt-10 sm:px-9" noValidate={false}>
      <NouveauCorners />
      {/* A library slip: a dashed tear line, as on a borrowing card. */}
      <div className="-mt-2 flex items-center gap-3 border-b-2 border-dashed border-line-strong pb-3 font-serif text-title font-semibold" aria-hidden="true">
        Suggestion slip
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-url" className="font-bold">
          Link to the resource <span className="font-normal text-muted">(required)</span>
        </label>
        <input id="s-url" name="url" type="url" required placeholder="https://…" className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-title" className="font-bold">
          Title
        </label>
        <input id="s-title" name="title" type="text" maxLength={300} className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-why" className="font-bold">
          Why does it belong in Open Sun?
        </label>
        <textarea id="s-why" name="why" rows={4} maxLength={2000} className={`${field} py-3`} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-name" className="font-bold">
          Your name <span className="font-normal text-muted">(optional, shown publicly in the review queue)</span>
        </label>
        <input id="s-name" name="name" type="text" maxLength={100} autoComplete="name" className={field} />
      </div>
      {/* Spam trap: hidden from people, often filled in by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="s-website">Leave this empty</label>
        <input id="s-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-small text-muted">Please don’t include private information. Suggestions are posted to the site’s public review list.</p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status.kind === 'sending'} className="min-h-12 rounded-full bg-leaf px-6 font-bold text-white disabled:opacity-60">
          {status.kind === 'sending' ? 'Sending…' : 'Send suggestion'}
        </button>
        <p role="status" aria-live="polite" className="text-copy text-terracotta">
          {status.kind === 'error' ? status.message : ''}
        </p>
      </div>
    </form>
  );
}
