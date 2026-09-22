import { useEffect, useState } from 'react';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PlatformConfig } from '@/pages/AdminPortal';

interface PlatformSettingsDashboardProps {
  config: PlatformConfig | null;
  onSaved: (updated: PlatformConfig) => void;
}

type FormState = {
  support_email: string;
  whatsapp_support_number: string;
  api_base_url: string;
  max_monthly_community_events: string;
  max_monthly_academy_events: string;
  default_payment_window_start_day: string;
  default_payment_window_end_day: string;
  default_report_window_day: string;
  max_location_changes: string;
  location_change_window_days: string;
  otp_mandatory_for_location: boolean;
};

function toFormState(c: PlatformConfig | null): FormState {
  return {
    support_email: c?.support_email || '',
    whatsapp_support_number: c?.whatsapp_support_number || '',
    api_base_url: c?.api_base_url || '',
    max_monthly_community_events: String(c?.max_monthly_community_events ?? ''),
    max_monthly_academy_events: String(c?.max_monthly_academy_events ?? ''),
    default_payment_window_start_day: String(c?.default_payment_window_start_day ?? ''),
    default_payment_window_end_day: String(c?.default_payment_window_end_day ?? ''),
    default_report_window_day: String(c?.default_report_window_day ?? ''),
    max_location_changes: String(c?.max_location_changes ?? ''),
    location_change_window_days: String(c?.location_change_window_days ?? ''),
    otp_mandatory_for_location: c?.otp_mandatory_for_location ?? true,
  };
}

export function PlatformSettingsDashboard({ config, onSaved }: PlatformSettingsDashboardProps) {
  const [form, setForm] = useState<FormState>(toFormState(config));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setForm(toFormState(config));
  }, [config]);

  const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSavedNotice(false);
    try {
      const payload = {
        id: 'global',
        support_email: form.support_email.trim() || null,
        whatsapp_support_number: form.whatsapp_support_number.trim() || null,
        api_base_url: form.api_base_url.trim() || null,
        max_monthly_community_events: numOrNull(form.max_monthly_community_events),
        max_monthly_academy_events: numOrNull(form.max_monthly_academy_events),
        default_payment_window_start_day: numOrNull(form.default_payment_window_start_day),
        default_payment_window_end_day: numOrNull(form.default_payment_window_end_day),
        default_report_window_day: numOrNull(form.default_report_window_day),
        max_location_changes: numOrNull(form.max_location_changes),
        location_change_window_days: numOrNull(form.location_change_window_days),
        otp_mandatory_for_location: form.otp_mandatory_for_location,
        updated_at: new Date().toISOString(),
      };

      // Direct write — platform_config already has an admin-only RLS policy
      // ("Only admins can update platform config", gated on get_my_role() =
      // 'admin'), so no extra edge function round trip is needed just to
      // apply a settings change.
      const { data, error } = await supabase.from('platform_config').update(payload).eq('id', 'global').select().single();
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      onSaved(data as PlatformConfig);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const field = (label: string, key: keyof FormState, opts?: { hint?: string; type?: string }) => (
    <div>
      <label className="text-ink-300 block mb-1 text-xs">{label}</label>
      <input
        type={opts?.type || 'text'}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-white outline-none focus:border-slate-400"
      />
      {opts?.hint && <p className="mt-1 text-[10px] text-ink-500">{opts.hint}</p>}
    </div>
  );

  if (!config) {
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
        <p className="mt-3 text-sm text-white">Platform settings haven't loaded yet — try refreshing (Sync Data above).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Platform Settings</h2>
        <p className="mt-1 text-sm text-ink-400">
          One global row of settings every coach and parent's app reads from — support contact info, monthly event
          quotas, and default payment/report windows. Changes apply immediately, platform-wide.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}
      {savedNotice && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
          Saved — changes are live.
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Support Contact</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Support Email', 'support_email')}
            {field('WhatsApp Support Number', 'whatsapp_support_number', { hint: 'Shown to coaches/parents when they need help' })}
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Community Event Quotas</h3>
          <p className="text-[11px] text-ink-500 mb-3">
            This is exactly the limit a coach hits when the app tells them "Contact Platform Admin to increase your
            quota" — this is where you'd actually do that.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Max Public Events / Month', 'max_monthly_community_events', { type: 'number' })}
            {field('Max Private Events / Month', 'max_monthly_academy_events', { type: 'number' })}
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Default Windows</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {field('Payment Window Start Day', 'default_payment_window_start_day', { type: 'number' })}
            {field('Payment Window End Day', 'default_payment_window_end_day', { type: 'number' })}
            {field('Report Window Day', 'default_report_window_day', { type: 'number' })}
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Location Change Limits</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Max Location Changes', 'max_location_changes', { type: 'number' })}
            {field('Within Window (Days)', 'location_change_window_days', { type: 'number' })}
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-ink-300">
            <input
              type="checkbox"
              checked={form.otp_mandatory_for_location}
              onChange={(e) => setForm((f) => ({ ...f, otp_mandatory_for_location: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Require OTP verification for location changes
          </label>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">Advanced</h3>
          {field('API Base URL', 'api_base_url', { hint: 'Only change this if you know what it affects' })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-500 disabled:opacity-50"
          >
            {isSaving ? <Settings className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
