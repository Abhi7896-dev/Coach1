import { useMemo, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  ListChecks,
  ShieldBan,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CoachItem } from '@/pages/AdminPortal';

interface BulkStudentImportDashboardProps {
  coaches: CoachItem[];
}

interface ParsedRow {
  name: string;
  age: string;
  guardian_name: string;
  parent_phone: string;
  join_date: string;
  paid_until: string;
  error?: string;
}

interface BatchOption {
  id: string;
  title: string;
}

interface ImportResultRow {
  name: string;
  status: 'created' | 'linked_existing' | 'error';
  error?: string;
}

const EXPECTED_HEADERS = ['name', 'age', 'guardian_name', 'parent_phone', 'join_date', 'paid_until'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

// Admin-assisted onboarding: a coach's existing roster, brought in from a
// spreadsheet instead of typed in one by one through the mobile app. Treated
// as EXISTING students by design — no invoice is seeded on import, since
// these are people the coach already coaches and already collects fees from
// outside the app (paid_until is only set if the sheet provides it; left
// blank otherwise, which generates no bill until set deliberately later).
export function BulkStudentImportDashboard({ coaches }: BulkStudentImportDashboardProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [coachSearch, setCoachSearch] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<CoachItem | null>(null);

  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultRow[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const filteredCoaches = useMemo(() => {
    const q = coachSearch.trim().toLowerCase();
    if (!q) return coaches.slice(0, 20);
    return coaches.filter((c) => c.name.toLowerCase().includes(q) || c.academyName?.toLowerCase().includes(q)).slice(0, 20);
  }, [coachSearch, coaches]);

  const pickCoach = async (coach: CoachItem) => {
    setSelectedCoach(coach);
    setSelectedBatchId('');
    setBatches([]);
    setLoadingBatches(true);
    // On-demand, scoped to this one coach — not held in portal-wide state,
    // since this is a rarely-used tool, not part of the main dashboard load.
    const { data } = await supabase
      .from('batches')
      .select('id, title')
      .or(`tutor_id.eq.${coach.id},assigned_tutor_id.eq.${coach.id}`);
    setBatches(data || []);
    setLoadingBatches(false);
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setImportResults(null);
    setImportError(null);
    setFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (json.length === 0) {
        setParseError('No rows found in the first sheet of this file.');
        setRows([]);
        return;
      }

      const parsed: ParsedRow[] = json.map((raw) => {
        const normalized: Record<string, any> = {};
        Object.keys(raw).forEach((k) => {
          normalized[normalizeHeader(k)] = raw[k];
        });
        const name = String(normalized.name || '').trim();
        const parentPhone = String(normalized.parent_phone || normalized.phone || '').replace(/\D/g, '').slice(-10);
        let error: string | undefined;
        if (!name) error = 'Missing name';
        else if (parentPhone.length !== 10) error = 'Missing/invalid parent phone';
        return {
          name,
          age: String(normalized.age || '10'),
          guardian_name: String(normalized.guardian_name || '').trim(),
          parent_phone: parentPhone,
          join_date: String(normalized.join_date || '').trim(),
          paid_until: String(normalized.paid_until || '').trim(),
          error,
        };
      });
      setRows(parsed);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse file. Expected a .csv or .xlsx file.');
      setRows([]);
    }
  };

  const validRows = rows.filter((r) => !r.error);
  const invalidCount = rows.length - validRows.length;
  const canImport = !!selectedCoach && !!selectedBatchId && validRows.length > 0 && !importing;

  const handleImport = async () => {
    if (!selectedCoach || !selectedBatchId) return;
    setImporting(true);
    setImportError(null);
    setImportResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'bulk_import_students',
          tutor_id: selectedCoach.id,
          batch_id: selectedBatchId,
          students: validRows.map((r) => ({
            name: r.name,
            age: r.age,
            guardian_name: r.guardian_name,
            parent_phone: r.parent_phone,
            join_date: r.join_date || undefined,
            paid_until: r.paid_until || undefined,
          })),
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setImportResults(data.results || []);
    } catch (err: any) {
      setImportError(err?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFileName('');
    setRows([]);
    setParseError(null);
    setImportResults(null);
    setImportError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Bulk Import Students</h2>
        <p className="mt-1 text-sm text-ink-400">
          Bring in a coach's existing roster from a spreadsheet instead of adding students one at a time.
        </p>
      </div>

      {/* Full instructions — verified directly against the live database's
          triggers and constraints, not just what the import form asks for.
          Kept open by default and always re-openable, since getting
          paid_until/join_date wrong here means wrong billing, not just a
          cosmetic mistake. */}
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
        <button
          onClick={() => setInstructionsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <ListChecks className="h-4 w-4" />
            How This Import Works — Read Before Uploading
          </span>
          {instructionsOpen ? (
            <ChevronUp className="h-4 w-4 text-amber-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-400" />
          )}
        </button>

        {instructionsOpen && (
          <div className="space-y-5 border-t border-amber-500/20 px-6 pb-6 pt-4 text-xs leading-relaxed text-ink-300">
            <div>
              <p className="mb-1.5 font-bold text-white">Required columns</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <code className="font-mono text-amber-300">name</code> — student's full name.
                </li>
                <li>
                  <code className="font-mono text-amber-300">parent_phone</code> — exactly 10 digits. Rows missing
                  either of these are automatically skipped before import (flagged in the preview, not silently
                  dropped).
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-1.5 font-bold text-white">Optional columns, and what happens if you leave them blank</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <code className="font-mono text-sky-300">age</code> — defaults to <strong>10</strong>. Used only to
                  estimate a date of birth; not used for billing.
                </li>
                <li>
                  <code className="font-mono text-sky-300">guardian_name</code> — defaults to{' '}
                  <em>"Parent of &#123;name&#125;"</em>.
                </li>
                <li>
                  <code className="font-mono text-sky-300">join_date</code> (YYYY-MM-DD) — defaults to{' '}
                  <strong>today's date</strong>. This is the anchor the default billing calculation (below) is based
                  on — if you know the student's real start date with this coach, enter it here for an accurate
                  grace period instead of one based on the import date.
                </li>
                <li>
                  <code className="font-mono text-sky-300">paid_until</code> (YYYY-MM-DD) — see the billing section
                  below; this is the one that actually controls when billing resumes.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-1.5 font-bold text-white">Default billing cycle (applies only if paid_until is left blank)</p>
              <p className="mb-2 text-ink-400">
                A database rule automatically calculates a grace period from <code className="font-mono">join_date</code>,
                based on which day of the month it falls on:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Join date falls on day 1–10 → paid up through the <strong>end of that same month</strong>.</li>
                <li>Join date falls on day 11–24 → paid up through <strong>30 days after join_date</strong>.</li>
                <li>Join date falls on day 25–31 → paid up through the <strong>end of the following month</strong>.</li>
              </ul>
              <p className="mt-2 text-ink-400">
                Once that calculated date passes, this student automatically joins the platform's normal recurring
                billing cycle — exactly like any student added the regular way. This is not optional or something
                this tool can disable; it's a standing database rule.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <p className="mb-1.5 font-bold text-emerald-300">How to override the billing date for a specific student</p>
              <p className="text-ink-300">
                Fill in <code className="font-mono text-emerald-300">paid_until</code> for that row with an exact
                date (YYYY-MM-DD) — e.g. if they've already paid you through 31 March 2027 outside the app, enter{' '}
                <code className="font-mono">2027-03-31</code>. The database rule above only fires when this column is
                left empty; an explicit value you provide is always used exactly as given, never recalculated.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-rose-300">
                <ShieldBan className="h-3.5 w-3.5" /> There is no "never bill this student" option
              </p>
              <p className="text-ink-300">
                <code className="font-mono">paid_until</code> is a "paid up to" date, not a permanent exemption
                switch. If a student should never be auto-billed in-app at all, the closest option is setting{' '}
                <code className="font-mono">paid_until</code> far enough in the future that it won't come up for
                renewal any time soon, and revisiting it manually later.
              </p>
            </div>

            <div>
              <p className="mb-1.5 font-bold text-white">What never happens at import time, no matter what</p>
              <p className="text-ink-400">
                No invoice or receipt is created during import — nothing is written to the finance ledger as part of
                this tool, regardless of what paid_until ends up being. Billing only ever resumes later, on its own,
                once paid_until passes.
              </p>
            </div>

            <div>
              <p className="mb-1.5 font-bold text-white">Duplicate handling</p>
              <p className="text-ink-400">
                If a student with the same name + parent phone already exists anywhere on the platform, this import
                links the existing record to this coach's batch instead of creating a second copy.
              </p>
            </div>

            <div>
              <p className="mb-1.5 font-bold text-white">Rows that will be rejected automatically</p>
              <ul className="list-disc space-y-1 pl-5 text-ink-400">
                <li>A parent phone already linked to 2 students elsewhere on the platform (platform-wide limit — not per coach).</li>
                <li>A parent phone that's actually a registered coach/academy admin's own phone number.</li>
              </ul>
              <p className="mt-2 text-ink-400">
                Rejected rows are reported individually with the exact reason after import — they don't stop or roll
                back the rest of the batch.
              </p>
            </div>

            <div>
              <p className="mb-1.5 font-bold text-white">Scope & limits</p>
              <ul className="list-disc space-y-1 pl-5 text-ink-400">
                <li>Every student in one uploaded file goes into the single batch you select below. For multiple batches, run the import once per batch.</li>
                <li>Maximum 500 students per import file.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Step 1: Coach */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">1. Select Coach</h3>
        {selectedCoach ? (
          <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">{selectedCoach.name}</p>
              <p className="text-xs text-ink-400">{selectedCoach.academyName}</p>
            </div>
            <button
              onClick={() => {
                setSelectedCoach(null);
                setBatches([]);
                setSelectedBatchId('');
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              Change
            </button>
          </div>
        ) : (
          <div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                value={coachSearch}
                onChange={(e) => setCoachSearch(e.target.value)}
                placeholder="Search coach or academy name..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filteredCoaches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickCoach(c)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5"
                >
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-ink-500">{c.academyName}</span>
                </button>
              ))}
              {filteredCoaches.length === 0 && <p className="px-3 py-2 text-xs text-ink-500">No coaches match.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Batch */}
      {selectedCoach && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">2. Select Batch to Enroll Into</h3>
          {loadingBatches ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : batches.length === 0 ? (
            <p className="text-xs text-ink-500">This coach has no batches yet — create one first.</p>
          ) : (
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#141a26] p-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Choose a batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 3: Upload */}
      {selectedCoach && selectedBatchId && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3">3. Upload Spreadsheet</h3>
          <p className="mb-3 text-[11px] text-ink-500">
            Columns (first row = headers, case-insensitive):{' '}
            <code className="font-mono text-ink-300">{EXPECTED_HEADERS.join(', ')}</code>. Only{' '}
            <span className="text-white">name</span> and <span className="text-white">parent_phone</span> are
            required — full details on every column and the billing default are in "How This Import Works" above.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-10 text-center hover:border-blue-500/50">
            <UploadCloud className="h-8 w-8 text-ink-500" />
            <span className="text-sm font-semibold text-white">{fileName || 'Click to choose a .csv or .xlsx file'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
          {parseError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Preview + Import */}
      {rows.length > 0 && !importResults && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400">
              4. Review ({validRows.length} ready{invalidCount > 0 ? `, ${invalidCount} skipped` : ''})
            </h3>
            <button onClick={reset} className="text-xs font-bold text-ink-400 hover:text-white">
              Start Over
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#141a26] text-ink-400">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Age</th>
                  <th className="px-3 py-2">Guardian</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Join Date</th>
                  <th className="px-3 py-2">Paid Until</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-white/5 ${r.error ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2 text-white">{r.name || '—'}</td>
                    <td className="px-3 py-2 text-ink-300">{r.age}</td>
                    <td className="px-3 py-2 text-ink-300">{r.guardian_name || '—'}</td>
                    <td className="px-3 py-2 text-ink-300">{r.parent_phone || '—'}</td>
                    <td className="px-3 py-2 text-ink-300">{r.join_date || '(today)'}</td>
                    <td className="px-3 py-2 text-ink-300">{r.paid_until || '(auto)'}</td>
                    <td className="px-3 py-2">
                      {r.error ? (
                        <span className="text-rose-400">{r.error}</span>
                      ) : (
                        <span className="text-emerald-400">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!canImport}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-40"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            {importing ? 'Importing...' : `Import ${validRows.length} Student(s) into ${selectedCoach?.name}'s Roster`}
          </button>
        </div>
      )}

      {/* Step 5: Results */}
      {importResults && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Users className="h-4 w-4 text-emerald-400" /> Import Complete
            </h3>
            <button onClick={reset} className="text-xs font-bold text-blue-400 hover:text-blue-300">
              Import Another File
            </button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl bg-emerald-500/10 py-3">
              <p className="text-lg font-bold text-emerald-400">{importResults.filter((r) => r.status === 'created').length}</p>
              <p className="text-ink-400">Created</p>
            </div>
            <div className="rounded-xl bg-sky-500/10 py-3">
              <p className="text-lg font-bold text-sky-400">{importResults.filter((r) => r.status === 'linked_existing').length}</p>
              <p className="text-ink-400">Linked Existing</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 py-3">
              <p className="text-lg font-bold text-rose-400">{importResults.filter((r) => r.status === 'error').length}</p>
              <p className="text-ink-400">Failed</p>
            </div>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {importResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
                {r.status === 'error' ? (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                )}
                <span className="text-white">{r.name}</span>
                {r.error && <span className="text-rose-400">— {r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
