import { useState } from 'react';
import { CalendarDays, MapPin, Globe, Lock, Trash2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CommunityEventItem } from '@/pages/AdminPortal';

interface CommunityEventsDashboardProps {
  events: CommunityEventItem[];
  onEventDeleted: (eventId: string) => void;
}

export function CommunityEventsDashboard({ events, onEventDeleted }: CommunityEventsDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = events.filter((e) => {
    if (filter === 'public') return e.is_public;
    if (filter === 'private') return !e.is_public;
    return true;
  });

  const handleDelete = async (event: CommunityEventItem) => {
    if (!confirm(`Remove "${event.title}"? This can't be undone.`)) return;
    setDeletingId(event.id);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'delete_community_event', event_id: event.id },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || error?.message || 'Failed to delete event.');
        return;
      }
      onEventDeleted(event.id);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Community Events ({events.length})</h2>
        <p className="mt-1 text-sm text-ink-400">
          Every event a coach has posted — public marketplace listings and private batch-scoped announcements. There's
          no other way to see or remove these; only the organizing coach can otherwise touch their own event.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'public', 'private'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-all ${
              filter === f ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40' : 'bg-white/5 text-ink-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">No events {filter !== 'all' ? `(${filter})` : ''} yet</p>
          <p className="mt-1 text-xs text-ink-400">Events coaches create will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((event) => (
            <div key={event.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-base font-bold text-white">{event.title}</h4>
                    {event.is_public ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        <Globe className="h-2.5 w-2.5" /> Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        <Lock className="h-2.5 w-2.5" /> Private
                        {event.target_batch_ids && event.target_batch_ids.length > 0 && (
                          <span> · {event.target_batch_ids.length} batch{event.target_batch_ids.length === 1 ? '' : 'es'}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-400 mt-1">
                    {event.academy_name || event.tutor_name} · {event.sport_name}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(event)}
                  disabled={deletingId === event.id}
                  className="p-1.5 text-ink-500 hover:text-rose-400 disabled:opacity-50"
                  title="Remove event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {event.description && (
                <p className="mt-3 text-xs text-ink-300 leading-relaxed">{event.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {event.event_date} · {event.start_time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {event.booked_count}/{event.max_capacity}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {event.tutor_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
