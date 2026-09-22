import { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Save,
  X,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type HeaderType = 'none' | 'text' | 'image' | 'link';

interface BotRule {
  id: string;
  keyword: string;
  match_type: 'exact' | 'contains';
  reply_message: string;
  is_active: boolean;
  priority: number;
  updated_at: string | null;
  header_type: HeaderType;
  header_value: string | null;
  footer_text: string | null;
}

interface SessionWindow {
  phone: string;
  last_message_at: string;
}

const emptyForm = {
  keyword: '',
  match_type: 'contains' as 'exact' | 'contains',
  reply_message: '',
  priority: '0',
  header_type: 'none' as HeaderType,
  header_value: '',
  footer_text: '',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function hoursRemaining(iso: string): number {
  const expiresAt = new Date(iso).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, (expiresAt - Date.now()) / (60 * 60 * 1000));
}

function WhatsAppSessionWindowsPanel() {
  const [windows, setWindows] = useState<SessionWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_session_windows')
      .select('phone, last_message_at')
      .order('last_message_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('whatsapp_session_windows')) {
        setSetupNeeded(true);
      }
      setWindows([]);
      setIsLoading(false);
      return;
    }
    setWindows(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (setupNeeded) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          <h3 className="font-display text-base font-bold text-white">
            Recently Active on WhatsApp ({windows.length})
          </h3>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Numbers that messaged the WhatsApp Business number in the last 24 hours — Meta's free-form reply window is
        still open for these. No message content is stored, only the phone number and when they last wrote in;
        entries disappear automatically once 24 hours pass.
      </p>

      {windows.length === 0 ? (
        <p className="mt-4 text-xs text-ink-500">No one has messaged in the last 24 hours.</p>
      ) : (
        <div className="mt-4 space-y-1.5">
          {windows.map((w) => (
            <div
              key={w.phone}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 text-xs"
            >
              <span className="font-mono font-semibold text-white">{w.phone}</span>
              <div className="flex items-center gap-3 text-ink-400">
                <span>{timeAgo(w.last_message_at)}</span>
                <span className="text-ink-600">•</span>
                <span>{hoursRemaining(w.last_message_at).toFixed(1)}h window left</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatsAppBotDashboard() {
  const [rules, setRules] = useState<BotRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const load = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSetupNeeded(false);
    try {
      const { data, error } = await supabase
        .from('whatsapp_bot_rules')
        .select('id, keyword, match_type, reply_message, is_active, priority, updated_at, header_type, header_value, footer_text')
        .order('priority', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.toLowerCase().includes('whatsapp_bot_rules')) {
          setSetupNeeded(true);
        } else {
          setErrorMsg(error.message);
        }
        setRules([]);
        return;
      }
      setRules(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load automation bot rules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRule = async () => {
    if (!form.keyword.trim() || !form.reply_message.trim()) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('whatsapp_bot_rules').insert({
        keyword: form.keyword.trim(),
        match_type: form.match_type,
        reply_message: form.reply_message.trim(),
        priority: parseInt(form.priority, 10) || 0,
        created_by: user?.id,
        header_type: form.header_type,
        header_value: form.header_type === 'none' ? null : form.header_value.trim() || null,
        footer_text: form.footer_text.trim() || null,
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setForm(emptyForm);
      setIsAdding(false);
      load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: BotRule) => {
    await supabase.from('whatsapp_bot_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const handleDelete = async (rule: BotRule) => {
    await supabase.from('whatsapp_bot_rules').delete().eq('id', rule.id);
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
  };

  const startEditing = (rule: BotRule) => {
    setEditingId(rule.id);
    setEditForm({
      keyword: rule.keyword,
      match_type: rule.match_type,
      reply_message: rule.reply_message,
      priority: String(rule.priority),
      header_type: rule.header_type || 'none',
      header_value: rule.header_value || '',
      footer_text: rule.footer_text || '',
    });
  };

  const saveEditing = async (rule: BotRule) => {
    const updatePayload = {
      keyword: editForm.keyword.trim(),
      match_type: editForm.match_type,
      reply_message: editForm.reply_message.trim(),
      priority: parseInt(editForm.priority, 10) || 0,
      header_type: editForm.header_type,
      header_value: editForm.header_type === 'none' ? null : editForm.header_value.trim() || null,
      footer_text: editForm.footer_text.trim() || null,
    };
    const { error } = await supabase.from('whatsapp_bot_rules').update(updatePayload).eq('id', rule.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setRules((prev) =>
      prev
        .map((r) => (r.id === rule.id ? { ...r, ...updatePayload } : r))
        .sort((a, b) => b.priority - a.priority)
    );
    setEditingId(null);
  };

  if (setupNeeded) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-lg font-bold text-white">One-time setup needed</h3>
            <p className="mt-2 text-sm text-ink-300 leading-relaxed">
              Run <code className="font-mono text-amber-300">supabase_whatsapp_bot_setup.sql</code> in Supabase SQL
              Editor (after <code className="font-mono text-amber-300">supabase_whatsapp_inbox_setup.sql</code>) to
              create the <code className="font-mono text-amber-300">whatsapp_bot_rules</code> table.
            </p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Automation Bot</h2>
        <p className="mt-1 text-sm text-ink-400">
          Define keyword-triggered canned replies for incoming WhatsApp messages. These only ever fire in response
          to a message a user just sent — no Meta-approved template required.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-xs text-sky-300">
        <Bot className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          When a user's message matches a rule below, the bot sends that reply automatically. Rules are checked in
          priority order (highest first) — the first match wins, so put your most specific keywords at a higher
          priority than general ones.
        </span>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <WhatsAppSessionWindowsPanel />

      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-white">Bot Rules ({rules.length})</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isAdding ? 'Cancel' : 'Add Rule'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            <div>
              <label className="text-ink-300 block mb-1">
                Keyword(s) <span className="text-ink-500 normal-case font-normal">— comma-separated, matches any</span>
              </label>
              <input
                type="text"
                placeholder="e.g. hi, hello, hey"
                value={form.keyword}
                onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-ink-300 block mb-1">Match Type</label>
              <select
                value={form.match_type}
                onChange={(e) => setForm((f) => ({ ...f, match_type: e.target.value as 'exact' | 'contains' }))}
                className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-sky-500"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact match</option>
              </select>
            </div>
            <div>
              <label className="text-ink-300 block mb-1">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="text-ink-300 block mb-1">Reply Message</label>
              <textarea
                rows={3}
                placeholder="e.g. Fees are due between the 1st and 7th of every month. For your exact batch fee, please check the app under 'Payments'."
                value={form.reply_message}
                onChange={(e) => setForm((f) => ({ ...f, reply_message: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-ink-300 block mb-1">Header</label>
              <select
                value={form.header_type}
                onChange={(e) => setForm((f) => ({ ...f, header_type: e.target.value as HeaderType }))}
                className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-sky-500"
              >
                <option value="none">None</option>
                <option value="text">Text</option>
                <option value="image">Image (URL)</option>
                <option value="link">Link</option>
              </select>
            </div>
            {form.header_type !== 'none' && (
              <div className="sm:col-span-3">
                <label className="text-ink-300 block mb-1">
                  {form.header_type === 'image' ? 'Image URL' : form.header_type === 'link' ? 'Link URL' : 'Header Text'}
                </label>
                <input
                  type="text"
                  placeholder={
                    form.header_type === 'image'
                      ? 'https://.../banner.png'
                      : form.header_type === 'link'
                        ? 'https://trucoach.co.in/...'
                        : 'e.g. TruCoach Fee Reminder'
                  }
                  value={form.header_value}
                  onChange={(e) => setForm((f) => ({ ...f, header_value: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>
            )}
            <div className="sm:col-span-4">
              <label className="text-ink-300 block mb-1">
                Footer <span className="text-ink-500 normal-case font-normal">— optional, shown as a smaller line at the end</span>
              </label>
              <input
                type="text"
                placeholder="e.g. — TruCoach Support"
                value={form.footer_text}
                onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddRule}
              disabled={isSaving || !form.keyword.trim() || !form.reply_message.trim()}
              className="rounded-xl bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-sky-500" />
          <p className="mt-3 text-xs text-ink-400">Loading automation bot rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <Bot className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">No automation rules yet</p>
          <p className="mt-1 text-xs text-ink-400">Tap "Add Rule" above to create the first canned auto-reply.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const isEditing = editingId === rule.id;
            return (
              <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {isEditing ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <input
                        type="text"
                        placeholder="keyword1, keyword2"
                        value={editForm.keyword}
                        onChange={(e) => setEditForm((f) => ({ ...f, keyword: e.target.value }))}
                        className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
                      />
                      <select
                        value={editForm.match_type}
                        onChange={(e) => setEditForm((f) => ({ ...f, match_type: e.target.value as 'exact' | 'contains' }))}
                        className="rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-sky-500"
                      >
                        <option value="contains">Contains</option>
                        <option value="exact">Exact match</option>
                      </select>
                      <input
                        type="number"
                        value={editForm.priority}
                        onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                        className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => saveEditing(rule)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-emerald-400 hover:bg-emerald-500/25"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-ink-300 hover:bg-white/20"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={editForm.reply_message}
                      onChange={(e) => setEditForm((f) => ({ ...f, reply_message: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
                    />
                    <div className="grid gap-3 sm:grid-cols-4">
                      <select
                        value={editForm.header_type}
                        onChange={(e) => setEditForm((f) => ({ ...f, header_type: e.target.value as HeaderType }))}
                        className="rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-sky-500"
                      >
                        <option value="none">No header</option>
                        <option value="text">Text header</option>
                        <option value="image">Image header (URL)</option>
                        <option value="link">Link header</option>
                      </select>
                      {editForm.header_type !== 'none' && (
                        <input
                          type="text"
                          placeholder={editForm.header_type === 'image' ? 'Image URL' : editForm.header_type === 'link' ? 'Link URL' : 'Header text'}
                          value={editForm.header_value}
                          onChange={(e) => setEditForm((f) => ({ ...f, header_value: e.target.value }))}
                          className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500 sm:col-span-2"
                        />
                      )}
                      <input
                        type="text"
                        placeholder="Footer (optional)"
                        value={editForm.footer_text}
                        onChange={(e) => setEditForm((f) => ({ ...f, footer_text: e.target.value }))}
                        className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-ink-400">{rule.match_type === 'exact' ? '=' : '⊃'}</span>
                        {rule.keyword
                          .split(',')
                          .map((k) => k.trim())
                          .filter((k) => k.length > 0)
                          .map((k, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-300 font-mono"
                            >
                              "{k}"
                            </span>
                          ))}
                        <span className="text-[10px] text-ink-500">Priority {rule.priority}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleActive(rule)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            rule.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-ink-400'
                          }`}
                        >
                          {rule.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => startEditing(rule)}
                          className="p-1.5 text-ink-500 hover:text-sky-400"
                          title="Edit rule"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="p-1.5 text-ink-500 hover:text-rose-400"
                          title="Delete rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-ink-300 leading-relaxed">{rule.reply_message}</p>
                    {(rule.header_type !== 'none' || rule.footer_text) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {rule.header_type !== 'none' && (
                          <span className="rounded-lg bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                            {rule.header_type === 'image' ? 'Image header' : rule.header_type === 'link' ? 'Link header' : 'Text header'}: {rule.header_value}
                          </span>
                        )}
                        {rule.footer_text && (
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-ink-300">
                            Footer: {rule.footer_text}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
