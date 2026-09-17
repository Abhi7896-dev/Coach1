import { useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Users, UserPlus, Calendar, Phone, MapPin } from 'lucide-react';
import { ParentItem } from '@/pages/AdminPortal';

interface GrowthDashboardProps {
  parents: ParentItem[];
}

type RangeDays = 7 | 30 | 90;

const CHART_W = 760;
const CHART_H = 220;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function niceMax(value: number): number {
  if (value <= 0) return 4;
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

export function GrowthDashboard({ parents }: GrowthDashboardProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const lineSvgRef = useRef<SVGSVGElement | null>(null);

  const { daily, cumulative, stats, recent } = useMemo(() => {
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

    const countsByDay = new Map<string, number>();
    days.forEach((d) => countsByDay.set(d.key, 0));

    let totalBeforeRange = 0;
    const validParents = parents.filter((p) => p.registeredAt);

    validParents.forEach((p) => {
      const d = new Date(p.registeredAt as string);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      if (d < start) {
        totalBeforeRange++;
      } else if (countsByDay.has(key)) {
        countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
      }
    });

    let running = totalBeforeRange;
    const daily = days.map((d) => ({ date: d.date, count: countsByDay.get(d.key) || 0 }));
    const cumulative = daily.map((d) => {
      running += d.count;
      return { date: d.date, total: running };
    });

    const newInRange = daily.reduce((s, d) => s + d.count, 0);

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - rangeDays);
    let newInPrevRange = 0;
    validParents.forEach((p) => {
      const d = new Date(p.registeredAt as string);
      if (d >= prevStart && d < start) newInPrevRange++;
    });
    const growthPct =
      newInPrevRange > 0
        ? ((newInRange - newInPrevRange) / newInPrevRange) * 100
        : newInRange > 0
        ? 100
        : 0;

    const recent = [...validParents]
      .sort((a, b) => new Date(b.registeredAt as string).getTime() - new Date(a.registeredAt as string).getTime())
      .slice(0, 8);

    return {
      daily,
      cumulative,
      recent,
      stats: {
        totalParents: parents.length,
        newInRange,
        growthPct,
        avgPerDay: newInRange / rangeDays,
        withoutDate: parents.length - validParents.length,
      },
    };
  }, [parents, rangeDays]);

  // ---- Bar chart geometry (daily new registrations) ----
  const barMax = niceMax(Math.max(...daily.map((d) => d.count), 1));
  const bandW = (CHART_W - PAD_LEFT - PAD_RIGHT) / daily.length;
  const barW = Math.max(2, Math.min(22, bandW * 0.6));
  const yFromCount = (count: number) =>
    CHART_H - PAD_BOTTOM - (count / barMax) * (CHART_H - PAD_TOP - PAD_BOTTOM);

  const barLabelStride = rangeDays <= 7 ? 1 : rangeDays <= 30 ? 5 : 15;

  const handleBarMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = barSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const idx = Math.round((relX - PAD_LEFT - bandW / 2) / bandW);
    setHoveredBar(Math.max(0, Math.min(daily.length - 1, idx)));
  };

  // ---- Line chart geometry (cumulative total) ----
  const lineMin = Math.min(...cumulative.map((d) => d.total));
  const lineMaxRaw = Math.max(...cumulative.map((d) => d.total));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">New Registrations</h2>
          <p className="mt-1 text-sm text-ink-400">
            Growth trend of parents joining TruCoach — installs &amp; sign-ups over time.
          </p>
        </div>

        {/* Date range filter — one row, scopes everything below it */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([7, 30, 90] as RangeDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rangeDays === d ? 'bg-blue-600 text-white shadow-md' : 'text-ink-400 hover:bg-white/[0.06]'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {/* KPI stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Parents</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{stats.totalParents}</div>
          <p className="mt-2 text-xs text-ink-400">All-time registered guardians</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
              New (Last {rangeDays}d)
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
              <UserPlus className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{stats.newInRange}</div>
          <p className="mt-2 text-xs text-ink-400">~{stats.avgPerDay.toFixed(1)} per day average</p>
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
          <p className="mt-2 text-xs text-ink-400">vs the previous {rangeDays}-day period</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Undated Records</span>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-400">
              <Calendar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-white">{stats.withoutDate}</div>
          <p className="mt-2 text-xs text-ink-400">Parents with no registration timestamp</p>
        </div>
      </div>

      {/* Daily new registrations — bar chart, single series (magnitude) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-bold text-white">Daily New Registrations</h3>
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
                <line
                  x1={PAD_LEFT}
                  x2={CHART_W - PAD_RIGHT}
                  y1={yFromCount(tick)}
                  y2={yFromCount(tick)}
                  stroke="#2c2c2a"
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 8} y={yFromCount(tick) + 3} textAnchor="end" fontSize="10" fill="#898781">
                  {tick}
                </text>
              </g>
            ))}

            {daily.map((d, i) => {
              const x = PAD_LEFT + i * bandW + (bandW - barW) / 2;
              const y = yFromCount(d.count);
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
                    fill={isHovered ? '#ff7f37' : '#fb5a0c'}
                  />
                  {(i % barLabelStride === 0 || i === daily.length - 1) && (
                    <text
                      x={x + barW / 2}
                      y={CHART_H - PAD_BOTTOM + 14}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#898781"
                    >
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
                top: `${(Math.max(yFromCount(daily[hoveredBar].count), PAD_TOP) / CHART_H) * 100}%`,
              }}
            >
              <p className="text-ink-400">{formatShortDate(daily[hoveredBar].date)}</p>
              <p className="font-bold text-white">
                {daily[hoveredBar].count} new parent{daily[hoveredBar].count === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative growth — line + area, single series (trend over time) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-bold text-white">Cumulative Parent Growth</h3>
          <span className="text-xs text-ink-400">Running total</span>
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
              <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3282fb" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3282fb" stopOpacity={0} />
              </linearGradient>
            </defs>

            {lineYTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={PAD_LEFT}
                  x2={CHART_W - PAD_RIGHT}
                  y1={yFromTotal(tick)}
                  y2={yFromTotal(tick)}
                  stroke="#2c2c2a"
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 8} y={yFromTotal(tick) + 3} textAnchor="end" fontSize="10" fill="#898781">
                  {tick}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#growthArea)" stroke="none" />
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
                  {cumulative[cumulative.length - 1].total}
                </text>
              </>
            )}

            {hoveredLine !== null && cumulative[hoveredLine] && (
              <line
                x1={xFromIdx(hoveredLine)}
                x2={xFromIdx(hoveredLine)}
                y1={PAD_TOP}
                y2={CHART_H - PAD_BOTTOM}
                stroke="#c3c2b7"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
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
              <p className="font-bold text-white">{cumulative[hoveredLine].total} total parents</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent registrations — identity/table view (also the accessible fallback for the charts above) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-display text-base font-bold text-white mb-4">Recently Joined Parents</h3>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-center text-xs text-ink-400">
            No dated parent registrations found in this range.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Guardian</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Locality</th>
                  <th className="px-4 py-3">Children</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                    <td className="px-4 py-3 text-ink-300 font-mono flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-ink-400" />
                      {p.phone}
                    </td>
                    <td className="px-4 py-3 text-ink-300">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-ink-400" />
                        {p.locality || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-300">{p.childrenCount}</td>
                    <td className="px-4 py-3 text-ink-400">
                      {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
