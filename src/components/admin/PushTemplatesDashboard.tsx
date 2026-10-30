import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Pencil, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PushTemplateRow {
  event_key: string;
  title_template: string;
  body_template: string;
  is_active: boolean;
  notes: string;
  updated_at: string | null;
}

// This dashboard's four actions (get/update/toggle/delete) already exist in
// admin-operations and have for a while — they were just never given a UI.
// Routed through the edge function (not a direct table read like the
// WhatsApp templates dashboard) because that's how this table was designed
// to be touched; push_notification_templates has no public RLS policy of
// its own.
export function PushTemplatesDashboard() {
  const [rows, setRows] = useState<PushTemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const load = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_push_templates' },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setRows(data?.templates || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load push notification templates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newKey.trim() || !newTitle.trim() || !newBody.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_push_template',
          event_key: newKey.trim(),
          title_template: newTitle.trim(),
          body_template: newBody.trim(),
          is_active: true,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setNewKey('');
      setNewTitle('');
      setNewBody('');
      setIsAdding(false);
      load();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row: PushTemplateRow) => {
    setRows((prev) => prev.map((r) => (r.event_key === row.event_key ? { ...r, is_active: !r.is_active } : r)));
    const { error } = await supabase.functions.invoke('admin-operations', {
      body: { action: 'toggle_push_template', event_key: row.event_key, is_active: !row.is_active },
    });
    if (error) {
      setErrorMsg(error.message);
      load();
    }
  };

  const handleDelete = async (row: PushTemplateRow) => {
    setRows((prev) => prev.filter((r) => r.event_key !== row.event_key));
    const { error } = await supabase.functions.invoke('admin-operations', {
      body: { action: 'delete_push_template', event_key: row.event_key },
    });
    if (error) {
      setErrorMsg(error.message);
      load();
    }
  };

  const startEdit = (row: PushTemplateRow) => {
    setEditingKey(row.event_key);
    setEditTitle(row.title_template);
    setEditBody(row.body_template);
    setEditNotes(row.notes || '');
  };

  const saveEdit = async (row: PushTemplateRow) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_push_template',
          event_key: row.event_key,
          title_template: editTitle.trim(),
          body_template: editBody.trim(),
          is_active: row.is_active,
          notes: editNotes,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setRows((prev) =>
        prev.map((r) =>
          r.event_key === row.event_key
            ? { ...r, title_template: editTitle.trim(), body_template: editBody.trim(), notes: editNotes }
            : r
        )
      );
      setEditingKey(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Push Notification Templates</h2>
        <p className="mt-1 text-sm text-ink-400">
          Title/body wording for automated OneSignal push alerts, keyed by event (e.g. attendance_marked,
          payment_received).
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-white">Template Registry ({rows.length})</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isAdding ? 'Cancel' : 'New Template'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3 text-xs">
          <div>
            <label className="text-ink-300 block mb-1">Event Key (unique, e.g. attendance_marked)</label>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.trim())}
              placeholder="attendance_marked"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="text-ink-300 block mb-1">Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Attendance Updated"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="text-ink-300 block mb-1">Body</label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="{{student_name}} was marked {{status}} today."
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-rose-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
          <p className="mt-3 text-xs text-ink-400">Loading template registry...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">No push templates registered yet</p>
          <p className="mt-1 text-xs text-ink-400">Tap "New Template" above to add the first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const isEditing = editingKey === row.event_key;
            return (
              <div key={row.event_key} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-base font-bold text-white">{row.event_key}</h4>
                    {row.updated_at && (
                      <p className="text-xs text-ink-400 mt-0.5">
                        Updated {new Date(row.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggle(row)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        row.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-ink-400'
                      }`}
                    >
                      {row.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {row.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1.5 text-ink-500 hover:text-rose-400"
                      title="Delete template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-rose-500"
                      placeholder="Title"
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-rose-500"
                      placeholder="Body"
                    />
                    <input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-rose-500"
                      placeholder="Internal notes (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(row)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        <Save className="h-3 w-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-ink-300 hover:text-white"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs">
                    <p className="font-bold text-white">{row.title_template}</p>
                    <p className="mt-1 text-ink-400 leading-relaxed">{row.body_template}</p>
                    {row.notes && <p className="mt-2 text-[11px] text-ink-500">Note: {row.notes}</p>}
                    <button
                      onClick={() => startEdit(row)}
                      className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] font-bold"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
