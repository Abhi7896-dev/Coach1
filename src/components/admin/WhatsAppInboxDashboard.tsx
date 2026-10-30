import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  Search,
  Bot,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Save,
  X,
  ShieldQuestion,
  Clock,
  Settings,
  UploadCloud,
  RefreshCw,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Conversation {
  phone: string;
  body: string | null;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

interface Message {
  id: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  body: string | null;
  media_url: string | null;
  status: string;
  sent_by: string | null;
  created_at: string;
  raw_payload?: { status_errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }> } | null;
}

interface BotRule {
  id: string;
  keyword: string;
  match_type: 'exact' | 'contains';
  reply_message: string;
  header_type: 'none' | 'text' | 'image' | 'video' | 'link';
  header_value: string | null;
  footer_text: string | null;
  is_active: boolean;
  priority: number;
}

type InboxView = 'inbox' | 'bot' | 'settings';

const EMPTY_RULE: Omit<BotRule, 'id'> = {
  keyword: '',
  match_type: 'contains',
  reply_message: '',
  header_type: 'none',
  header_value: '',
  footer_text: '',
  is_active: true,
  priority: 0,
};

async function callProxy(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('whatsapp-inbox-proxy', { body: { action, ...params } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:<mime>;base64,<data>" — strip the prefix.
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadMedia(file: File): Promise<string> {
  if (file.size > 16 * 1024 * 1024) {
    throw new Error("File too large — 16MB max (Meta's own limit for WhatsApp media).");
  }
  const file_base64 = await fileToBase64(file);
  const data = await callProxy('upload_media', { file_base64, file_name: file.name, content_type: file.type || 'application/octet-stream' });
  return data.url as string;
}

// Drop-or-click uploader for an image/video header — uploads immediately
// via the proxy (service-role key, never a browser-exposed one) and hands
// the resulting public URL back through onUploaded. The URL field next to
// it still works too, for pasting an already-public link directly.
// WhatsApp-style relative time: just the time for today, "Yesterday" for
// yesterday, short date otherwise — matches how the real app shows it.
function formatChatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

// Deterministic avatar color per phone number, so the same contact always
// gets the same color — matches the "colored initial circle" pattern real
// chat apps use when there's no profile photo.
const AVATAR_COLORS = ['#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#6366F1', '#F97316', '#14B8A6'];
function avatarColor(phone: string): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) hash = (hash * 31 + phone.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function MessageStatusTick({ status, raw_payload }: { status: string; raw_payload?: Message['raw_payload'] }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-400" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-ink-400" />;
  if (status === 'sent') return <Check className="h-3.5 w-3.5 text-ink-400" />;
  if (status === 'failed') {
    const err = raw_payload?.status_errors?.[0];
    const reason = [err?.title || err?.message, err?.error_data?.details].filter(Boolean).join(' — ');
    return (
      <span title={reason ? `Delivery failed: ${reason}` : 'Delivery failed'}>
        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
      </span>
    );
  }
  return null;
}

const EMOJI_GROUPS: Array<{ label: string; emojis: string[] }> = [
  {
    label: 'Smileys',
    emojis: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤔', '😅', '😇', '🙂', '🙃', '😴', '😭', '😡', '🥳', '😢', '😮'],
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '🙏', '👏', '🙌', '💪', '🤝', '✌️', '🤞', '👌', '✋', '👋', '💯', '🔥', '✨', '🎉', '❤️', '💔', '⭐', '✅'],
  },
  {
    label: 'Objects',
    emojis: ['📚', '📝', '📅', '⏰', '📞', '💰', '🎓', '🏆', '📈', '📌', '✏️', '📎', '🔔', '🚀', '💡', '🎯', '👨‍🏫', '👩‍🏫', '🧑‍🎓', '🏫'],
  },
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-2xl border border-white/10 bg-[#233138] p-3 shadow-2xl"
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">{group.label}</p>
          <div className="grid grid-cols-8 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="rounded-lg py-1 text-lg transition-transform hover:scale-125 hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Renders the rule's comma-separated keyword string as live, removable
// chips instead of a bare text field — matches how whatsapp-webhook's
// matchRule() actually treats the value (any one phrase matching fires the
// rule), so the UI now shows that instead of looking like one flat string.
function KeywordTagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tags = value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const [draft, setDraft] = useState('');

  const addTags = (raw: string) => {
    const parts = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const merged = Array.from(new Set([...tags, ...parts]));
    onChange(merged.join(', '));
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag).join(', '));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 focus-within:border-emerald-500">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-emerald-500/15 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-emerald-300">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="rounded-full text-emerald-300/70 hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          if (e.target.value.includes(',')) {
            const parts = e.target.value.split(',');
            const last = parts.pop() || '';
            addTags(parts.join(','));
            setDraft(last);
          } else {
            setDraft(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTags(draft);
            setDraft('');
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1).join(', '));
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            addTags(draft);
            setDraft('');
          }
        }}
        placeholder={tags.length ? 'Add another...' : 'hi, hello, hey'}
        className="min-w-[90px] flex-1 bg-transparent py-1 text-xs text-white outline-none placeholder:text-ink-500"
      />
    </div>
  );
}

function MediaDropZone({ accept, onUploaded }: { accept: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadMedia(file);
      onUploaded(url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-1.5">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-3 text-[11px] transition-colors ${
          isDragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/15 bg-white/[0.02] hover:border-emerald-500/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
        ) : (
          <UploadCloud className="h-3.5 w-3.5 text-ink-400" />
        )}
        <span className="text-ink-400">{busy ? 'Uploading...' : 'Drop a file here, or click to choose'}</span>
      </div>
      {error && <p className="mt-1 text-[10px] text-rose-400">{error}</p>}
    </div>
  );
}

// Super Admin dashboard tab for the standalone WhatsApp project — every
// call here goes through whatsapp-inbox-proxy, never a direct client to
// the other project (no second anon key / RLS system in the browser at
// all). isSuperAdmin only gates the retention POLICY change below; manual
// cleanup and everything else is available to any admin.
export function WhatsAppInboxDashboard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [view, setView] = useState<InboxView>('inbox');
  const [notConfigured, setNotConfigured] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ── Inbox ────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [withinWindow, setWithinWindow] = useState<boolean | null>(null);

  const [replyText, setReplyText] = useState('');
  const [replyHeaderType, setReplyHeaderType] = useState<'none' | 'text' | 'image' | 'video' | 'link'>('none');
  const [replyHeaderValue, setReplyHeaderValue] = useState('');
  const [replyFooter, setReplyFooter] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = async () => {
    setLoadingConversations(true);
    setGlobalError(null);
    try {
      const data = await callProxy('list_recent_conversations');
      setConversations(data.conversations || []);
      setNotConfigured(false);
    } catch (err: any) {
      if (String(err.message || '').includes('not configured')) setNotConfigured(true);
      else setGlobalError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, selectedPhone]);

  // Auto-grow the composer as the admin types a longer reply, instead of
  // clipping it to a single fixed-height line.
  useEffect(() => {
    const el = replyTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [replyText, selectedPhone]);

  const openConversation = async (phone: string) => {
    setSelectedPhone(phone);
    setLoadingMessages(true);
    setReplyText('');
    setReplyHeaderType('none');
    setReplyHeaderValue('');
    setReplyFooter('');
    try {
      const [msgData, windowData] = await Promise.all([
        callProxy('list_messages', { phone, limit: 100 }),
        callProxy('check_session_window', { phone }),
      ]);
      setMessages((msgData.messages || []).slice().reverse());
      setWithinWindow(windowData.within_window);
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Background polling — Meta's delivered/read status callbacks land in the
  // DB asynchronously, well after the initial send. Without this, the tick
  // next to a sent message would only ever update when you hit refresh by
  // hand. Silent (no spinner, no composer reset) so it doesn't interrupt
  // whatever you're mid-typing. Still just the proxy -> the isolated
  // WhatsApp project's REST API — zero added load on the main project's DB.
  useEffect(() => {
    if (!selectedPhone || view !== 'inbox') return;
    const id = setInterval(async () => {
      try {
        const [msgData, windowData] = await Promise.all([
          callProxy('list_messages', { phone: selectedPhone, limit: 100 }),
          callProxy('check_session_window', { phone: selectedPhone }),
        ]);
        setMessages((msgData.messages || []).slice().reverse());
        setWithinWindow(windowData.within_window);
      } catch {
        // transient poll failure — don't surface as a blocking error
      }
    }, 6000);
    return () => clearInterval(id);
  }, [selectedPhone, view]);

  useEffect(() => {
    if (view !== 'inbox') return;
    const id = setInterval(async () => {
      try {
        const data = await callProxy('list_recent_conversations');
        setConversations(data.conversations || []);
      } catch {
        // transient poll failure — don't surface as a blocking error
      }
    }, 20000);
    return () => clearInterval(id);
  }, [view]);

  const handleSendReply = async () => {
    if (!selectedPhone || !replyText.trim()) return;
    setSending(true);
    try {
      await callProxy('send_reply', {
        to: selectedPhone,
        message: replyText.trim(),
        header_type: replyHeaderType === 'none' ? undefined : replyHeaderType,
        header_value: replyHeaderValue.trim() || undefined,
        footer_text: replyFooter.trim() || undefined,
      });
      setReplyText('');
      setReplyHeaderType('none');
      setReplyHeaderValue('');
      setReplyFooter('');
      await openConversation(selectedPhone);
      loadConversations();
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (phone: string) => {
    if (!confirm(`Permanently delete the entire conversation with +91 ${phone}? This cannot be undone.`)) return;
    try {
      await callProxy('delete_conversation', { phone });
      if (selectedPhone === phone) {
        setSelectedPhone(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err: any) {
      setGlobalError(err.message);
    }
  };

  // ── Bot rules ────────────────────────────────────────────────────────
  const [rules, setRules] = useState<BotRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<BotRule | Omit<BotRule, 'id'> | null>(null);
  const [showRuleEmojiPicker, setShowRuleEmojiPicker] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const data = await callProxy('get_bot_rules');
      setRules(data.rules || []);
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    if (view === 'bot' && rules.length === 0) loadRules();
  }, [view]);

  const saveRule = async () => {
    if (!editingRule || !editingRule.keyword.trim() || !editingRule.reply_message.trim()) return;
    setSavingRule(true);
    try {
      await callProxy('upsert_bot_rule', { rule: editingRule });
      setEditingRule(null);
      loadRules();
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setSavingRule(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this bot rule?')) return;
    try {
      await callProxy('delete_bot_rule', { id });
      loadRules();
    } catch (err: any) {
      setGlobalError(err.message);
    }
  };

  const toggleRule = async (rule: BotRule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
    try {
      await callProxy('upsert_bot_rule', { rule: { ...rule, is_active: !rule.is_active } });
    } catch (err: any) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: rule.is_active } : r)));
      setGlobalError(err.message);
    }
  };

  // ── Settings & cleanup ───────────────────────────────────────────────
  const [retentionDays, setRetentionDays] = useState<string>('');
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [cleanupBeforeDate, setCleanupBeforeDate] = useState('');
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const loadRetention = async () => {
    setLoadingRetention(true);
    try {
      const data = await callProxy('get_retention_settings');
      setRetentionDays(data.retention_days != null ? String(data.retention_days) : '');
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoadingRetention(false);
    }
  };

  useEffect(() => {
    if (view === 'settings') loadRetention();
  }, [view]);

  const saveRetention = async () => {
    setSavingRetention(true);
    try {
      await callProxy('set_retention_settings', { retention_days: retentionDays.trim() === '' ? null : Number(retentionDays) });
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setSavingRetention(false);
    }
  };

  const runCleanupBefore = async () => {
    if (!cleanupBeforeDate) return;
    if (!confirm(`Delete every message before ${cleanupBeforeDate}, across all conversations? This cannot be undone.`)) return;
    setCleanupBusy(true);
    setCleanupResult(null);
    try {
      const data = await callProxy('delete_messages_before', { before: cleanupBeforeDate });
      setCleanupResult(`Deleted ${data.deleted_count ?? 'an unknown number of'} messages.`);
      loadConversations();
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setCleanupBusy(false);
    }
  };

  if (notConfigured) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-14 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm font-bold text-white">WhatsApp project not connected yet</p>
        <p className="max-w-md text-xs text-ink-400">
          Set <code className="font-mono text-amber-300">WHATSAPP_PROJECT_URL</code> and{' '}
          <code className="font-mono text-amber-300">WHATSAPP_PROJECT_SERVICE_KEY</code> secrets on this project, then
          refresh.
        </p>
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) => c.phone.includes(search.trim()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">WhatsApp Inbox</h2>
          <p className="mt-1 text-sm text-ink-400">Live conversations, bot automation, and data retention — fully isolated from the main database.</p>
        </div>
        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([
            ['inbox', 'Inbox', MessageCircle],
            ['bot', 'Bot Rules', Bot],
            ['settings', 'Settings & Cleanup', Settings],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                view === id ? 'bg-emerald-600 text-white' : 'text-ink-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {globalError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="ml-auto text-ink-500 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── INBOX ───────────────────────────────────────────────────────── */}
      {view === 'inbox' && (
        <div className="grid grid-cols-[280px_1fr] overflow-hidden rounded-3xl border border-white/10" style={{ height: '70vh', minHeight: 480, maxHeight: 720 }}>
          {/* Conversation list */}
          <div className="flex h-full min-h-0 min-w-0 flex-col border-r border-white/10 bg-[#111b21]">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-[#1f2c34] to-[#202c33] px-4 py-3">
              <h3 className="text-sm font-bold text-white">Chats</h3>
              <button
                onClick={loadConversations}
                disabled={loadingConversations}
                title="Refresh conversations"
                className="rounded-full p-1.5 text-ink-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="border-b border-white/10 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a phone number"
                  className="w-full rounded-full border-none bg-white/5 py-2 pl-8 pr-3 text-xs text-white outline-none focus:bg-white/10"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
              {loadingConversations ? (
                <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-emerald-500" />
              ) : filteredConversations.length === 0 ? (
                <p className="py-10 text-center text-xs text-ink-500">No conversations yet.</p>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.phone}
                    onClick={() => openConversation(c.phone)}
                    className={`relative flex w-full items-center gap-3 border-b border-white/[0.03] px-4 py-3 text-left transition-colors ${
                      selectedPhone === c.phone ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {selectedPhone === c.phone && <span className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500" />}
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-md transition-transform ${
                        selectedPhone === c.phone ? 'scale-105 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-[#111b21]' : ''
                      }`}
                      style={{ backgroundColor: avatarColor(c.phone) }}
                    >
                      {c.phone.slice(-2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-white">+91 {c.phone}</span>
                        <span className="shrink-0 text-[10px] text-ink-500">{formatChatTime(c.created_at)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-400">
                        {c.direction === 'outbound' ? 'You: ' : ''}
                        {c.body || `[${c.direction} message]`}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div
            className="flex h-full min-h-0 min-w-0 flex-col bg-[#0b141a]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.025) 2px, transparent 0), radial-gradient(circle at 60px 60px, rgba(255,255,255,0.02) 2px, transparent 0)',
              backgroundSize: '80px 80px',
            }}
          >
            {!selectedPhone ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-500">
                <MessageCircle className="h-12 w-12 opacity-30" />
                <p className="text-xs">Select a conversation to view messages.</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-[#1f2c34] to-[#202c33] px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: avatarColor(selectedPhone) }}
                    >
                      {selectedPhone.slice(-2)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">+91 {selectedPhone}</p>
                      {withinWindow !== null && (
                        <p className={`text-[10px] ${withinWindow ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {withinWindow ? '24h reply window open' : 'Reply window closed'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openConversation(selectedPhone)}
                      disabled={loadingMessages}
                      title="Refresh messages"
                      className="rounded-full p-2 text-ink-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(selectedPhone)}
                      className="rounded-full p-2 text-ink-300 hover:bg-rose-500/20 hover:text-rose-400"
                      title="Delete this conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                {loadingMessages ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                    {messages.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-600">
                        <MessageCircle className="h-10 w-10 opacity-20" />
                        <p className="text-xs">No messages yet in this conversation.</p>
                      </div>
                    )}
                    {messages.map((m, i) => {
                      const prev = messages[i - 1];
                      const showDateDivider = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                      const grouped = !showDateDivider && prev?.direction === m.direction;
                      return (
                        <div key={m.id}>
                          {showDateDivider && (
                            <div className="my-3 flex items-center justify-center">
                              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400 shadow-sm">
                                {formatDateDivider(m.created_at)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`animate-msg-in flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-2.5'}`}
                          >
                            <div
                              className={`relative max-w-[70%] rounded-lg px-3 py-2 text-[13px] shadow-sm transition-transform hover:-translate-y-px ${
                                m.direction === 'outbound'
                                  ? `bg-[#005c4b] text-white ${grouped ? 'rounded-tr-lg' : 'rounded-tr-none'}`
                                  : `bg-[#202c33] text-ink-100 ${grouped ? 'rounded-tl-lg' : 'rounded-tl-none'}`
                              }`}
                            >
                              {m.media_url && !m.media_url.startsWith('meta-media-id:') && (
                                <a
                                  href={m.media_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mb-1 block overflow-hidden rounded-md border border-white/10"
                                >
                                  {m.message_type === 'video' ? (
                                    <video src={m.media_url} className="max-h-48 w-full object-cover" controls />
                                  ) : (
                                    <img src={m.media_url} className="max-h-48 w-full object-cover" alt="attachment" />
                                  )}
                                </a>
                              )}
                              <p className="whitespace-pre-wrap leading-relaxed">{m.body || `[${m.message_type}]`}</p>
                              <div className="mt-1 flex items-center justify-end gap-1">
                                <span className="text-[10px] text-white/50">{formatChatTime(m.created_at)}</span>
                                {m.direction === 'outbound' && <MessageStatusTick status={m.status} raw_payload={m.raw_payload} />}
                              </div>
                              {m.status === 'failed' && m.raw_payload?.status_errors?.[0] && (
                                <p className="mt-1 border-t border-white/10 pt-1 text-[10px] text-rose-300">
                                  Not delivered — {m.raw_payload.status_errors[0].title || m.raw_payload.status_errors[0].message}
                                  {m.raw_payload.status_errors[0].error_data?.details ? `: ${m.raw_payload.status_errors[0].error_data.details}` : ''}
                                  {m.raw_payload.status_errors[0].code ? ` (code ${m.raw_payload.status_errors[0].code})` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {withinWindow === false && (
                  <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> Meta will reject a free-form reply — this contact hasn't messaged in 24h.
                  </div>
                )}

                {/* Composer */}
                <div className="border-t border-white/10 bg-[#202c33] p-3">
                  {showAttachOptions && (
                    <div className="mb-2 space-y-2 rounded-xl bg-black/20 p-3">
                      <div className="flex gap-2">
                        <select
                          value={replyHeaderType}
                          onChange={(e) => setReplyHeaderType(e.target.value as any)}
                          className="rounded-lg border border-white/10 bg-[#141a26] px-2 py-2 text-[11px] text-white outline-none"
                        >
                          <option value="none">No header</option>
                          <option value="text">Text header</option>
                          <option value="image">Image header</option>
                          <option value="video">Video header</option>
                          <option value="link">Link header</option>
                        </select>
                        {replyHeaderType !== 'none' && (
                          <input
                            value={replyHeaderValue}
                            onChange={(e) => setReplyHeaderValue(e.target.value)}
                            placeholder={replyHeaderType === 'image' || replyHeaderType === 'video' ? 'Public media URL (or drop a file below)' : replyHeaderType === 'link' ? 'https://...' : 'Header text'}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                          />
                        )}
                      </div>
                      {(replyHeaderType === 'image' || replyHeaderType === 'video') && (
                        <>
                          <MediaDropZone
                            accept={replyHeaderType === 'image' ? 'image/jpeg,image/png' : 'video/mp4,video/3gpp'}
                            onUploaded={(url) => setReplyHeaderValue(url)}
                          />
                          <p className="text-[10px] text-ink-500">
                            {replyHeaderType === 'image'
                              ? 'WhatsApp only supports JPEG/PNG images.'
                              : 'WhatsApp needs H.264 video + AAC audio. iPhone videos are often HEVC by default — they\'ll show "sent" but silently fail. Fix: Settings → Camera → Formats → "Most Compatible", or re-export via QuickTime first.'}
                          </p>
                        </>
                      )}
                      <input
                        value={replyFooter}
                        onChange={(e) => setReplyFooter(e.target.value)}
                        placeholder="Footer text (optional)"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        title="Emoji"
                        className={`shrink-0 rounded-full p-2.5 transition-colors ${
                          showEmojiPicker ? 'bg-emerald-600 text-white' : 'text-ink-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Smile className="h-4.5 w-4.5" />
                      </button>
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={(emoji) => setReplyText((t) => t + emoji)}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => setShowAttachOptions((v) => !v)}
                      title="Header, media & footer options"
                      className={`shrink-0 rounded-full p-2.5 transition-colors ${
                        showAttachOptions || replyHeaderType !== 'none' ? 'bg-emerald-600 text-white' : 'text-ink-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </button>
                    <textarea
                      ref={replyTextareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={1}
                      placeholder="Type a message"
                      style={{ maxHeight: 160 }}
                      className="flex-1 resize-none overflow-y-auto rounded-2xl border border-transparent bg-white/10 px-4 py-2.5 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-ink-500 focus:border-emerald-500/50 focus:bg-white/[0.07] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyText.trim()}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition-all hover:scale-105 hover:bg-emerald-500 disabled:scale-100 disabled:opacity-40"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BOT RULES ───────────────────────────────────────────────────── */}
      {view === 'bot' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Bot className="h-5.5 w-5.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Keyword Auto-Reply Rules</h3>
                <p className="text-[11px] text-ink-400">
                  {rules.length} rule{rules.length === 1 ? '' : 's'} ·{' '}
                  {rules.filter((r) => r.is_active).length} active
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingRule({ ...EMPTY_RULE })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition-transform hover:scale-105 hover:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5" /> New Rule
            </button>
          </div>

          {editingRule && (
            <div className="animate-msg-in space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5 text-xs shadow-xl">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-400">
                <Bot className="h-3.5 w-3.5" /> {('id' in editingRule) ? 'Edit Rule' : 'New Rule'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-ink-300">Keyword(s)</label>
                  <KeywordTagInput
                    value={editingRule.keyword}
                    onChange={(v) => setEditingRule({ ...editingRule, keyword: v })}
                  />
                  <p className="mt-1 text-[10px] text-ink-500">
                    Type a phrase and press Enter (or comma) to add another — any one of them matching fires this rule.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-ink-300">Match Type</label>
                  <select
                    value={editingRule.match_type}
                    onChange={(e) => setEditingRule({ ...editingRule, match_type: e.target.value as any })}
                    className="w-full rounded-lg border border-white/10 bg-[#141a26] px-3 py-2 text-white outline-none"
                  >
                    <option value="contains">Contains</option>
                    <option value="exact">Exact match</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-ink-300">Reply Message</label>
                <div className="relative">
                  <textarea
                    value={editingRule.reply_message}
                    onChange={(e) => setEditingRule({ ...editingRule, reply_message: e.target.value })}
                    rows={5}
                    placeholder="What should the bot reply with?"
                    className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-9 text-[13px] leading-relaxed text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRuleEmojiPicker((v) => !v)}
                    title="Emoji"
                    className="absolute bottom-2 right-2 rounded-lg p-1 text-ink-400 hover:bg-white/10 hover:text-white"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  {showRuleEmojiPicker && (
                    <EmojiPicker
                      onSelect={(emoji) => setEditingRule({ ...editingRule, reply_message: editingRule.reply_message + emoji })}
                      onClose={() => setShowRuleEmojiPicker(false)}
                    />
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  <ImageIcon className="h-3.5 w-3.5" /> Reply Header (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-ink-300">Header Type</label>
                    <div className="grid grid-cols-5 gap-1">
                      {([
                        ['none', 'None', ShieldQuestion],
                        ['text', 'Text', MessageCircle],
                        ['image', 'Image', ImageIcon],
                        ['video', 'Video', VideoIcon],
                        ['link', 'Link', LinkIcon],
                      ] as const).map(([val, label, Icon]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditingRule({ ...editingRule, header_type: val })}
                          title={label}
                          className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] font-semibold transition-colors ${
                            editingRule.header_type === val
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white/5 text-ink-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingRule.header_type !== 'none' && (
                    <div>
                      <label className="mb-1 block text-ink-300">Header Value</label>
                      <input
                        value={editingRule.header_value || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, header_value: e.target.value })}
                        placeholder={editingRule.header_type === 'image' || editingRule.header_type === 'video' ? 'Public media URL (or drop a file below)' : editingRule.header_type === 'link' ? 'https://...' : 'Header text'}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
                {(editingRule.header_type === 'image' || editingRule.header_type === 'video') && (
                  <div className="mt-3">
                    {editingRule.header_value && (
                      <div className="mb-2 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        {editingRule.header_type === 'video' ? (
                          <video src={editingRule.header_value} className="max-h-40 w-full object-contain" controls />
                        ) : (
                          <img src={editingRule.header_value} className="max-h-40 w-full object-contain" alt="Header preview" />
                        )}
                      </div>
                    )}
                    <MediaDropZone
                      accept={editingRule.header_type === 'image' ? 'image/jpeg,image/png' : 'video/mp4,video/3gpp'}
                      onUploaded={(url) => setEditingRule({ ...editingRule, header_value: url })}
                    />
                    <p className="mt-1 text-[10px] text-ink-500">
                      {editingRule.header_type === 'image'
                        ? 'WhatsApp only supports JPEG/PNG images.'
                        : 'WhatsApp needs H.264 video + AAC audio. iPhone videos are often HEVC by default — they\'ll show "sent" but silently fail. Fix: Settings → Camera → Formats → "Most Compatible", or re-export via QuickTime first.'}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-ink-300">Footer Text (optional)</label>
                <input
                  value={editingRule.footer_text || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, footer_text: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 border-t border-white/10 pt-3">
                <button
                  onClick={saveRule}
                  disabled={savingRule}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 hover:bg-emerald-500 disabled:opacity-60"
                >
                  {savingRule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                </button>
                <button onClick={() => setEditingRule(null)} className="rounded-lg px-4 py-2 text-xs font-bold text-ink-400 hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loadingRules ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-500" />
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-14 text-ink-500">
              <Bot className="h-10 w-10 opacity-20" />
              <p className="text-xs">No auto-reply rules yet — create one to get started.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {rules.map((r) => {
                const HeaderIcon = r.header_type === 'image' ? ImageIcon : r.header_type === 'video' ? VideoIcon : r.header_type === 'link' ? LinkIcon : r.header_type === 'text' ? MessageCircle : null;
                return (
                  <div
                    key={r.id}
                    className={`group overflow-hidden rounded-2xl border bg-white/[0.03] transition-colors ${
                      r.is_active ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {r.header_value && (r.header_type === 'image' || r.header_type === 'video') && (
                      <div className="h-28 w-full overflow-hidden bg-black/30">
                        {r.header_type === 'video' ? (
                          <video src={r.header_value} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={r.header_value} className="h-full w-full object-cover" alt="Header" />
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {r.keyword.split(',').map((k) => k.trim()).filter(Boolean).map((k) => (
                              <span key={k} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                {k}
                              </span>
                            ))}
                            <span className="text-[10px] text-ink-500">({r.match_type})</span>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-300">{r.reply_message}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ink-500">
                            {HeaderIcon && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                                <HeaderIcon className="h-3 w-3" /> {r.header_type} header
                              </span>
                            )}
                            {r.footer_text && <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">footer</span>}
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">priority {r.priority}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <button
                            onClick={() => toggleRule(r)}
                            title={r.is_active ? 'Active — click to disable' : 'Inactive — click to enable'}
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-colors ${
                              r.is_active ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-white/5 text-ink-500 hover:bg-white/10'
                            }`}
                          >
                            {r.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {r.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => setEditingRule(r)} className="rounded-lg p-1.5 text-ink-500 hover:bg-white/10 hover:text-white">
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteRule(r.id)} className="rounded-lg p-1.5 text-ink-500 hover:bg-rose-500/15 hover:text-rose-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS & CLEANUP ──────────────────────────────────────────── */}
      {view === 'settings' && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-1 text-sm font-bold text-white">Standing Auto-Purge Policy</h3>
            <p className="mb-4 text-xs text-ink-400">
              A nightly job deletes messages older than this many days. Leave blank to keep everything forever (default).
            </p>
            {!isSuperAdmin ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-ink-400">
                <ShieldQuestion className="h-4 w-4 shrink-0" /> Super Admin access required to change this policy.
              </div>
            ) : loadingRetention ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  placeholder="Keep forever"
                  className="w-40 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-ink-400">days</span>
                <button
                  onClick={saveRetention}
                  disabled={savingRetention}
                  className="ml-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {savingRetention ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
            <h3 className="mb-1 text-sm font-bold text-rose-300">Manual Cleanup — Run Once Now</h3>
            <p className="mb-4 text-xs text-ink-400">
              Delete every message before a specific date, across all conversations. One-off, doesn't change the standing policy above.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={cleanupBeforeDate}
                onChange={(e) => setCleanupBeforeDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
              <button
                onClick={runCleanupBefore}
                disabled={cleanupBusy || !cleanupBeforeDate}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-40"
              >
                {cleanupBusy ? 'Deleting...' : 'Delete Everything Before This Date'}
              </button>
            </div>
            {cleanupResult && <p className="mt-3 text-xs text-emerald-400">{cleanupResult}</p>}
            <p className="mt-3 text-[11px] text-ink-500">
              To delete one specific conversation instead, open it in the Inbox tab and use the trash icon there.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
