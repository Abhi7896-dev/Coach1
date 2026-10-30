import { useState } from 'react';
import { Megaphone, Send, Loader2, CheckCircle2, AlertTriangle, ShieldQuestion } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Channel = 'push' | 'whatsapp';
type Audience = 'all' | 'parents' | 'coaches';

interface BroadcastDashboardProps {
  isSuperAdmin: boolean;
}

// Every other send path in this app is tied to a specific trigger (a
// payment, an event, a ticket reply). This is the one place to just write a
// message and send it to a whole audience at once — push reuses
// send-push-notification's own built-in broadcast/role targeting (no
// per-user query on our side), WhatsApp does one bulk phone-number fetch
// then a single batched dispatch. Root-owner only: it can reach every
// parent or coach on the platform in one click, with no undo.
export function BroadcastDashboard({ isSuperAdmin }: BroadcastDashboardProps) {
  const [channel, setChannel] = useState<Channel>('push');
  const [audience, setAudience] = useState<Audience>('parents');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
        <ShieldQuestion className="h-7 w-7 text-ink-500" />
        <p className="text-sm font-semibold text-white">Super Admin access required</p>
        <p className="text-xs text-ink-400">Broadcasting to the whole platform is a Super Admin-only action.</p>
      </div>
    );
  }

  const audienceLabel = audience === 'all' ? 'everyone' : audience;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'broadcast_message', channel, audience, title: title.trim() || undefined, message: message.trim() },
      });
      if (invokeErr || data?.error) throw new Error(data?.error || invokeErr?.message);
      const total = data?.result?.total ?? data?.result?.delivered_count;
      setResult(
        typeof total === 'number'
          ? `Sent to ${audienceLabel} — ${total} recipient(s).`
          : `Broadcast sent to ${audienceLabel}.`
      );
      setMessage('');
      setTitle('');
    } catch (err: any) {
      setError(err?.message || 'Broadcast failed.');
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  const canSend = message.trim().length > 0 && (channel === 'whatsapp' || title.trim().length > 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Broadcast Message</h3>
          <p className="text-xs text-ink-400">Send a push or WhatsApp message to an entire audience at once.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Channel
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['push', 'whatsapp'] as Channel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition-colors ${
                  channel === c
                    ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                    : 'border-white/10 bg-white/[0.02] text-ink-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Audience
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['all', 'parents', 'coaches'] as Audience[]).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`rounded-xl border px-2 py-2 text-[11px] font-bold capitalize transition-colors ${
                  audience === a
                    ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                    : 'border-white/10 bg-white/[0.02] text-ink-400 hover:text-white'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {channel === 'push' && (
        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="TruCoach"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-purple-500/50 focus:outline-none"
          />
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What do you want to tell them?"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-ink-600 focus:border-purple-500/50 focus:outline-none"
        />
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {result && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {confirming ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold text-amber-200">
            Send this {channel} message to {audienceLabel} now? This can't be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Yes, Send Now
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={sending}
              className="rounded-xl px-4 py-2 text-xs font-bold text-ink-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={!canSend}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Review & Send
        </button>
      )}
    </div>
  );
}
