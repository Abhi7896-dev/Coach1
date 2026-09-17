import { useMemo, useRef, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, IndianRupee, AlertCircle } from 'lucide-react';
import { CoachItem } from '@/pages/AdminPortal';

interface FeeTransactionsDashboardProps {
  financeLogs: any[];
  coaches: CoachItem[];
}

type RangeDays = 7 | 30 | 90;

const CHART_W = 760;
const CHART_H = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

// Validated categorical order (adjacent CVD ΔE 8.5+, normal-vision 31.3+,
// contrast >=3:1 vs this app's dark surface #0e121a) — every row is also
// direct-labeled with the method name, so identity never rests on hue alone.
const METHOD_COLORS = ['#3282fb', '#fb5a0c', '#19b062', '#a855f7', '#f59e0b'];
const OTHER_COLOR = '#5a6478';

const PAID_STATUS_HINTS = ['paid', 'success', 'complete', 'settled', 'captured'];
const isPaidStatus = (status: unknown) => {
  const s = typeof status === 'string' ? status.toLowerCase() : '';
  return PAID_STATUS_HINTS.some((hint) => s.includes(hint));
};

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return Math.ceil(value / magnitude) * magnitude;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMoney(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export function FeeTransactionsDashboard({ financeLogs, coaches }: FeeTransactionsDashboardProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const lineSvgRef = useRef<SVGSVGElement | null>(null);

  const coachByTutorId = useMemo(() => new Map(coaches.map((c) => [c.id, c])), [coaches]);

  const { daily, cumulative, stats, methodBreakdown, recent } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(now);
    start.setDate(start.getDate() - (rangeDays - 1));

    const days: { date: Date; key: string }[] = [];
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, key: d.toISOString().slice(0, 10) });
    }

    const amountByDay = new Map<string, number>();
    days.forEach((d) => amountByDay.set(d.key, 0));

    const logsWithDate = financeLogs.filter((f) => f.paid_at || f.created_at);

    let collectedBeforeRange = 0;
    logsWithDate.forEach((f) => {
      if (!isPaidStatus(f.status)) return;
      const d = new Date(f.paid_at || f.created_at);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const amount = Number(f.amount) || 0;
      if (d < start) {
        collectedBeforeRange += amount;
      } else if (amountByDay.has(key)) {
        amountByDay.set(key, (amountByDay.get(key) || 0) + amount);
      }
    });

    let running = collectedBeforeRange;
    const daily = days.map((d) => ({ date: d.date, amount: amountByDay.get(d.key) || 0 }));
    const cumulative = daily.map((d) => {
      running += d.amount;
      return { date: d.date, total: running };
    });

    const collectedInRange = daily.reduce((s, d) => s + d.amount, 0);

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - rangeDays);
    let collectedInPrevRange = 0;
    logsWithDate.forEach((f) => {
      if (!isPaidStatus(f.status)) return;
      const d = new Date(f.paid_at || f.created_at);
      if (d >= prevStart && d < start) collectedInPrevRange += Number(f.amount) || 0;
    });
    const growthPct =
      collectedInPrevRange > 0
        ? ((collectedInRange - collectedInPrevRange) / collectedInPrevRange) * 100
        : collectedInRange > 0
        ? 100
        : 0;

    const totalPotential = financeLogs.reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const totalPaid = financeLogs.filter((f) => isPaidStatus(f.status)).reduce((s, f) => s + (Number(f.amount) || 0), 0);

    // Payment-method breakdown — dynamic, not hardcoded, so it reflects
    // whatever gateway strings the app actually uses (Easebuzz, Cashfree, etc).
    const methodTotals = new Map<string, { total: number; count: number }>();
    financeLogs.forEach((f) => {
      if (!isPaidStatus(f.status)) return;
      const method = (f.payment_method || 'Unspecified').trim();
      const entry = methodTotals.get(method) || { total: 0, count: 0 };
      entry.total += Number(f.amount) || 0;
      entry.count += 1;
      methodTotals.set(method, entry);
    });
    const sortedMethods = Array.from(methodTotals.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.total - a.total);
    const topMethods = sortedMethods.slice(0, 5);
    const otherMethods = sortedMethods.slice(5);
    const methodBreakdown = [
      ...topMethods,
      ...(otherMethods.length > 0
        ? [
            {
              method: 'Other',
              total: otherMethods.reduce((s, m) => s + m.total, 0),
              count: otherMethods.reduce((s, m) => s + m.count, 0),
            },
          ]
        : []),
    ];

    const recent = [...financeLogs]
      .filter((f) => f.paid_at || f.created_at)
      .sort((a, b) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime())
      .slice(0, 8);

    return {
      daily,
      cumulative,
      recent,
      methodBreakdown,
      stats: {
        totalPotential,
        totalPaid,
        outstanding: totalPotential - totalPaid,
        collectedInRange,
        growthPct,
      },
    };
  }, [financeLogs, rangeDays]);

  const barMax = niceMax(Math.max(...daily.map((d) => d.amount), 1));
  const bandW = (CHART_W - PAD_LEFT - PAD_RIGHT) / daily.length;
  const barW = Math.max(2, Math.min(22, bandW * 0.6));
  const yFromAmount = (amount: number) =>
    CHART_H - PAD_BOTTOM - (amount / barMax) * (CHART_H - PAD_TOP - PAD_BOTTOM);
  const barLabelStride = rangeDays <= 7 ? 1 : rangeDays <= 30 ? 5 : 15;

  const handleBarMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = barSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const idx = Math.round((relX - PAD_LEFT - bandW / 2) / bandW);
    setHoveredBar(Math.max(0, Math.min(daily.length - 1, idx)));
  };

  const lineMaxRaw = Math.max(...cumulative.map((d) => d.total), 1);
  const lineMin = Math.min(...cumulative.map((d) => d.total), 0);
  const lineMax = niceMax(lineMaxRaw);
  const lineFloor = lineMin > 0 ? Math.floor(lineMin * 0.9) : 0;
  const xFromIdx = (i: number) => PAD_LEFT + (i / Math.max(1, cumulative.length - 1)) * (CHART_W - PAD_LEFT - PAD_RIGHT);
  const yFromTotal = (total: number) =>
    CHART_H -
    PAD_BOTTOM -
    ((total - lineFloor) / Math.max(1, lineMax - lineFloor)) * (CHART_H - PAD_TOP - PAD_BOTTOM);

  const linePath = cumulative
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFromIdx(i).toFixed(1)} ${yFromTotal(d.total).toFixed(1)}`)
    .join(' ');
  const areaPath =
    linePath +
    ` L ${xFromIdx(cumulative.length - 1).toFixed(1)} ${CHART_H - PAD_BOTTOM} L ${xFromIdx(0)} ${CHART_H - PAD_BOTTOM} Z`;

  const handleLineMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = lineSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let closest = 0;
    let closestDist = Infinity;
    cumulative.forEach((_, i) => {
      const dist = Math.abs(xFromIdx(i) - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoveredLine(closest);
  };

  const yTicks = [0, 0.5, 1].map((f) => Math.round(barMax * f));
  const lineYTicks = [0, 0.5, 1].map((f) => Math.round(lineFloor + (lineMax - lineFloor) * f));
  const methodMax = Math.max(...methodBreakdown.map((m) => m.total), 1);
  const totalMethodAmount = methodBreakdown.reduce((s, m) => s + m.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Fee Transactions</h2>
          <p className="mt-1 text-sm text-ink-400">
            Real cashflow across the platform — amounts actually moving through TruCoach.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([7, 30, 90] as RangeDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rangeDays === d ? 'bg-emerald-600 text-white shadow-md' : 'text-ink-400 hover:bg-white/[0.06]'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {financeLogs.length === 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>No fee transactions recorded in the database yet. This dashboard will populate as real payments come through.</span>
        </div>
      )}

      {/* KPI stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Paid (Received)</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{formatMoney(stats.totalPaid)}</div>
          <p className="mt-2 text-xs text-ink-400">All-time, across every coach</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Max Potential</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{formatMoney(stats.totalPotential)}</div>
          <p className="mt-2 text-xs text-ink-400">Every logged fee, any status</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Outstanding</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-amber-400">{formatMoney(stats.outstanding)}</div>
          <p className="mt-2 text-xs text-ink-400">Logged but not yet received</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Growth vs Prior Period</span>
            <span
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                stats.growthPct >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {stats.growthPct >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </span>
          </div>
          <div
            className={`mt-4 font-display text-3xl font-bold ${
              stats.growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.growthPct >= 0 ? '+' : ''}
            {stats.growthPct.toFixed(1)}%
          </div>
          <p className="mt-2 text-xs text-ink-400">{formatMoney(stats.collectedInRange)} collected in range</p>
        </div>
      </div>

      {/* Daily cash collected — bar chart, single series (magnitude) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-bold text-white">Daily Cash Collected</h3>
          <span className="text-xs text-ink-400">Last {rangeDays} days</span>
        </div>
        <div className="relative">
          <svg
            ref={barSvgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            onMouseMove={handleBarMove}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1={PAD_LEFT} x2={CHART_W - PAD_RIGHT} y1={yFromAmount(tick)} y2={yFromAmount(tick)} stroke="#2c2c2a" strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={yFromAmount(tick) + 3} textAnchor="end" fontSize="10" fill="#898781">
                  {formatMoney(tick)}
                </text>
              </g>
            ))}

            {daily.map((d, i) => {
              const x = PAD_LEFT + i * bandW + (bandW - barW) / 2;
              const y = yFromAmount(d.amount);
              const h = CHART_H - PAD_BOTTOM - y;
              const isHovered = hoveredBar === i;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={h > 0 ? y : CHART_H - PAD_BOTTOM}
                    width={barW}
                    height={Math.max(h, 0)}
                    rx={4}
                    fill={isHovered ? '#3dcb7c' : '#19b062'}
                  />
                  {(i % barLabelStride === 0 || i === daily.length - 1) && (
                    <text x={x + barW / 2} y={CHART_H - PAD_BOTTOM + 14} textAnchor="middle" fontSize="9" fill="#898781">
                      {formatShortDate(d.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredBar !== null && daily[hoveredBar] && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#0c1018] px-3 py-2 text-xs shadow-xl"
              style={{
                left: `${((PAD_LEFT + hoveredBar * bandW + bandW / 2) / CHART_W) * 100}%`,
                top: `${(Math.max(yFromAmount(daily[hoveredBar].amount), PAD_TOP) / CHART_H) * 100}%`,
              }}
            >
              <p className="text-ink-400">{formatShortDate(daily[hoveredBar].date)}</p>
              <p className="font-bold text-white">₹{daily[hoveredBar].amount.toLocaleString('en-IN')} collected</p>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative revenue — line + area, single series (trend over time) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-bold text-white">Cumulative Revenue</h3>
          <span className="text-xs text-ink-400">Running total received</span>
        </div>
        <div className="relative">
          <svg
            ref={lineSvgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            onMouseMove={handleLineMove}
            onMouseLeave={() => setHoveredLine(null)}
          >
            <defs>
              <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3282fb" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3282fb" stopOpacity={0} />
              </linearGradient>
            </defs>

            {lineYTicks.map((tick, i) => (
              <g key={i}>
                <line x1={PAD_LEFT} x2={CHART_W - PAD_RIGHT} y1={yFromTotal(tick)} y2={yFromTotal(tick)} stroke="#2c2c2a" strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={yFromTotal(tick) + 3} textAnchor="end" fontSize="10" fill="#898781">
                  {formatMoney(tick)}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#revenueArea)" stroke="none" />
            <path d={linePath} fill="none" stroke="#3282fb" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {cumulative.length > 0 && (
              <>
                <circle
                  cx={xFromIdx(cumulative.length - 1)}
                  cy={yFromTotal(cumulative[cumulative.length - 1].total)}
                  r={5}
                  fill="#3282fb"
                  stroke="#0e121a"
                  strokeWidth={2}
                />
                <text
                  x={xFromIdx(cumulative.length - 1) - 6}
                  y={yFromTotal(cumulative[cumulative.length - 1].total) - 10}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  {formatMoney(cumulative[cumulative.length - 1].total)}
                </text>
              </>
            )}

            {hoveredLine !== null && cumulative[hoveredLine] && (
              <line x1={xFromIdx(hoveredLine)} x2={xFromIdx(hoveredLine)} y1={PAD_TOP} y2={CHART_H - PAD_BOTTOM} stroke="#c3c2b7" strokeWidth={1} strokeDasharray="3,3" />
            )}

            {daily.map((d, i) =>
              i % barLabelStride === 0 || i === daily.length - 1 ? (
                <text key={i} x={xFromIdx(i)} y={CHART_H - PAD_BOTTOM + 14} textAnchor="middle" fontSize="9" fill="#898781">
                  {formatShortDate(d.date)}
                </text>
              ) : null
            )}
          </svg>

          {hoveredLine !== null && cumulative[hoveredLine] && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#0c1018] px-3 py-2 text-xs shadow-xl"
              style={{
                left: `${(xFromIdx(hoveredLine) / CHART_W) * 100}%`,
                top: `${(yFromTotal(cumulative[hoveredLine].total) / CHART_H) * 100}%`,
              }}
            >
              <p className="text-ink-400">{formatShortDate(cumulative[hoveredLine].date)}</p>
              <p className="font-bold text-white">₹{cumulative[hoveredLine].total.toLocaleString('en-IN')} total</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment method / gateway breakdown — categorical, direct-labeled */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-display text-base font-bold text-white mb-4">Collected by Payment Method / Gateway</h3>
        {methodBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-center text-xs text-ink-400">
            No paid transactions recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {methodBreakdown.map((m, i) => {
              const color = i < METHOD_COLORS.length ? METHOD_COLORS[i] : OTHER_COLOR;
              const pct = totalMethodAmount > 0 ? (m.total / totalMethodAmount) * 100 : 0;
              return (
                <div key={m.method}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {m.method}
                      <span className="text-ink-400 font-normal">({m.count} txns)</span>
                    </span>
                    <span className="font-bold text-white">
                      {formatMoney(m.total)} <span className="text-ink-400 font-normal">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(m.total / methodMax) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions — identity/table view, accessible fallback for the charts above */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-display text-base font-bold text-white mb-4">Recent Transactions</h3>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-center text-xs text-ink-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Coach / Academy</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((f) => {
                  const coach = coachByTutorId.get(f.tutor_id);
                  return (
                    <tr key={f.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{coach?.academyName || 'Unassigned'}</p>
                        <p className="text-ink-400">{coach?.name || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">₹{Number(f.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-ink-300 capitalize">{f.payment_method || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-300">
                          {f.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-400">
                        {new Date(f.paid_at || f.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
