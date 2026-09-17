import { useEffect, useMemo, useState } from 'react';
import {
  MessageCircle,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cloud,
  CloudOff,
  Pencil,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TemplateRow {
  template_name: string;
  language: string;
  is_active: boolean;
  updated_at: string | null;
  sample_variables: string[];
}

interface MetaTemplate {
  name: string;
  language: string;
  category?: string;
  status?: string;
  components?: { type: string; text?: string; example?: { body_text?: string[][] } }[];
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
];

function extractBodyText(t: MetaTemplate): string | null {
  return t.components?.find((c) => c.type === 'BODY')?.text || null;
}

function extractMetaExampleValues(t: MetaTemplate): string[] {
  const body = t.components?.find((c) => c.type === 'BODY');
  return body?.example?.body_text?.[0] || [];
}

function buildDemoMessage(bodyText: string, values: string[]): string {
  return bodyText.replace(/\{\{(\d+)\}\}/g, (_match, num) => {
    const idx = parseInt(num, 10) - 1;
    return values[idx] !== undefined && values[idx] !== '' ? values[idx] : `{{${num}}}`;
  });
}

export function WhatsAppTemplatesDashboard() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [metaTemplates, setMetaTemplates] = useState<Map<string, MetaTemplate>>(new Map());
  const [metaStatus, setMetaStatus] = useState<'loading' | 'connected' | 'not_configured' | 'error'>('loading');
  const [metaError, setMetaError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLanguage, setNewLanguage] = useState('en');

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<string[]>([]);

  const rowKey = (r: { template_name: string; language: string }) => `${r.template_name}__${r.language}`;

  const loadRegistry = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('template_name, language, is_active, updated_at, sample_variables')
        .order('template_name');

      if (error) {
        // sample_variables column not added yet — fall back without it so the
        // registry still works before the one-time SQL setup is run.
        if (error.message?.toLowerCase().includes('sample_variables')) {
          const fallback = await supabase
            .from('whatsapp_templates')
            .select('template_name, language, is_active, updated_at')
            .order('template_name');
          setRows((fallback.data || []).map((r: any) => ({ ...r, sample_variables: [] })));
        } else {
          setErrorMsg(error.message);
        }
        return;
      }
      setRows((data || []).map((r: any) => ({ ...r, sample_variables: r.sample_variables || [] })));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load WhatsApp template registry.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetaTemplates = async () => {
    setMetaStatus('loading');
    setMetaError(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-meta-templates');
      if (error || !data?.success) {
        const msg = data?.error || error?.message || 'Not connected yet';
        if (msg.toLowerCase().includes('not configured') || msg.toLowerCase().includes('not found')) {
          setMetaStatus('not_configured');
        } else {
          setMetaStatus('error');
        }
        setMetaError(msg);
        return;
      }
      const map = new Map<string, MetaTemplate>();
      (data.templates || []).forEach((t: MetaTemplate) => map.set(`${t.name}__${t.language}`, t));
      setMetaTemplates(map);
      setMetaStatus('connected');
    } catch (err: any) {
      setMetaStatus('not_configured');
      setMetaError(err?.message || 'Edge function not deployed yet');
    }
  };

  useEffect(() => {
    loadRegistry();
    loadMetaTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTemplate = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('whatsapp_templates').insert({
      template_name: newName.trim(),
      language: newLanguage,
      is_active: true,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setNewName('');
    setIsAdding(false);
    loadRegistry();
  };

  const handleToggleActive = async (row: TemplateRow) => {
    await supabase
      .from('whatsapp_templates')
      .update({ is_active: !row.is_active })
      .eq('template_name', row.template_name)
      .eq('language', row.language);
    setRows((prev) => prev.map((r) => (rowKey(r) === rowKey(row) ? { ...r, is_active: !r.is_active } : r)));
  };

  const handleDelete = async (row: TemplateRow) => {
    await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('template_name', row.template_name)
      .eq('language', row.language);
    setRows((prev) => prev.filter((r) => rowKey(r) !== rowKey(row)));
  };

  const startEditing = (row: TemplateRow) => {
    const meta = metaTemplates.get(rowKey(row));
    const metaExamples = meta ? extractMetaExampleValues(meta) : [];
    const varCount = meta ? (extractBodyText(meta)?.match(/\{\{\d+\}\}/g) || []).length : Math.max(row.sample_variables.length, 1);
    const initial = Array.from({ length: Math.max(varCount, row.sample_variables.length, 1) }, (_, i) =>
      row.sample_variables[i] ?? metaExamples[i] ?? ''
    );
    setEditingKey(rowKey(row));
    setEditingValues(initial);
  };

  const saveEditing = async (row: TemplateRow) => {
    const { error } = await supabase
      .from('whatsapp_templates')
      .update({ sample_variables: editingValues })
      .eq('template_name', row.template_name)
      .eq('language', row.language);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (rowKey(r) === rowKey(row) ? { ...r, sample_variables: editingValues } : r))
    );
    setEditingKey(null);
  };

  const metaConnectedCount = useMemo(
    () => rows.filter((r) => metaTemplates.has(rowKey(r))).length,
    [rows, metaTemplates]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">WhatsApp Templates</h2>
        <p className="mt-1 text-sm text-ink-400">
          Templates registered for automated WhatsApp alerts, receipts, and reminders.
        </p>
      </div>

      {/* Meta connection status */}
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs ${
          metaStatus === 'connected'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
            : 'border-amber-500/20 bg-amber-500/5 text-amber-300'
        }`}
      >
        {metaStatus === 'connected' ? (
          <Cloud className="h-4 w-4 shrink-0 mt-0.5" />
        ) : (
          <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
        )}
        <div>
          {metaStatus === 'loading' && <span>Checking connection to Meta WhatsApp Business API...</span>}
          {metaStatus === 'connected' && (
            <span>
              Connected to Meta — showing real approved wording for {metaConnectedCount} of {rows.length} registered
              template(s).
            </span>
          )}
          {(metaStatus === 'not_configured' || metaStatus === 'error') && (
            <>
              <span>
                Not connected to Meta yet — showing the local registry only (name, language, active status). Deploy{' '}
                <code className="font-mono">supabase/functions/whatsapp-meta-templates</code> and set{' '}
                <code className="font-mono">META_WHATSAPP_TOKEN</code> /{' '}
                <code className="font-mono">META_WABA_ID</code> secrets to pull real approved wording and Meta's own
                example variables.
              </span>
              {metaError && <p className="mt-1 text-ink-500">({metaError})</p>}
            </>
          )}
        </div>
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
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isAdding ? 'Cancel' : 'Register Template'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="sm:col-span-2">
              <label className="text-ink-300 block mb-1">
                Template Name (must exactly match the name approved in Meta Business Manager)
              </label>
              <input
                type="text"
                placeholder="e.g. batch_fee_reminder"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-ink-300 block mb-1">Language</label>
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-white outline-none focus:border-blue-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddTemplate}
              className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-xs text-ink-400">Loading template registry...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-ink-500" />
          <p className="mt-4 text-sm font-bold text-white">No WhatsApp templates registered yet</p>
          <p className="mt-1 text-xs text-ink-400">Tap "Register Template" above to add the first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const meta = metaTemplates.get(rowKey(row));
            const bodyText = meta ? extractBodyText(meta) : null;
            const isEditing = editingKey === rowKey(row);
            const demoValues = isEditing ? editingValues : row.sample_variables;
            const demoMessage = bodyText ? buildDemoMessage(bodyText, demoValues) : null;

            return (
              <div key={rowKey(row)} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-base font-bold text-white">{row.template_name}</h4>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {LANGUAGES.find((l) => l.code === row.language)?.label || row.language}
                      {meta?.category && <span> · {meta.category}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(row)}
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
                      title="Remove from registry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs">
                  {bodyText ? (
                    <>
                      <p className="text-ink-400 font-mono leading-relaxed">{bodyText}</p>
                    </>
                  ) : (
                    <p className="text-ink-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      Approved wording unavailable — connect Meta above to see it.
                    </p>
                  )}
                </div>

                {/* Variable editor */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                      Preview Variables
                    </span>
                    {isEditing ? (
                      <button
                        onClick={() => saveEditing(row)}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                      >
                        <Save className="h-3 w-3" /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(row)}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] font-bold"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {editingValues.map((v, i) => (
                        <input
                          key={i}
                          type="text"
                          value={v}
                          placeholder={`{{${i + 1}}}`}
                          onChange={(e) =>
                            setEditingValues((prev) => prev.map((val, idx) => (idx === i ? e.target.value : val)))
                          }
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                        />
                      ))}
                      <button
                        onClick={() => setEditingValues((prev) => [...prev, ''])}
                        className="text-[11px] text-ink-400 hover:text-white"
                      >
                        + add variable
                      </button>
                    </div>
                  ) : row.sample_variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {row.sample_variables.map((v, i) => (
                        <span key={i} className="rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] text-ink-200">
                          {`{{${i + 1}}}`} = {v || '(empty)'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-500">No sample values set yet.</p>
                  )}
                </div>

                {/* Demo message */}
                <div className="mt-4 rounded-2xl bg-ink-950 border border-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                    Demo Message
                  </p>
                  <p className="text-xs text-white leading-relaxed">
                    {demoMessage || 'Set preview variables and connect Meta to see a filled-in demo message.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
