import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.tsx';
import type { TrendBucket } from '../../server/analytics/analytics.service.ts';

export interface AnalyticsTrendsChartProps {
  title: string;
  description: string;
  timeRange: '24h' | '7d' | '30d';
  bucketInterval: '1h' | '1d';
  buckets: TrendBucket[];
  type: 'alerts' | 'incidents';
  /** "main" is the one large chart on the page, "compact" is the companion beside it. */
  size?: 'main' | 'compact';
}

// Chart colors. Severity keeps its meaning, everything else sits in neutral steps.
const COLOR = {
  critical: '#e5484d',
  high: '#d9a441',
  other: '#4a4a4f',
  declared: '#a1a1a6',
  resolved: '#3b6ee6',
  grid: 'rgba(237,237,237,0.08)',
  label: '#85858b',
  empty: '#38383b',
};

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 text-xs text-zinc-400">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export const AnalyticsTrendsChart: React.FC<AnalyticsTrendsChartProps> = ({
  title,
  description,
  bucketInterval,
  buckets,
  type,
  size = 'main',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [totalWidth, setTotalWidth] = useState(600);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Draw at real pixel width so labels stay 11px+ at every size
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setTotalWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [buckets]);

  if (!buckets || buckets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-body text-zinc-500">No trend data recorded for this window</CardContent>
      </Card>
    );
  }

  // Maximum value for the Y axis
  let maxValue = 1;
  for (const b of buckets) {
    const val = type === 'alerts' ? b.alertsTotal : Math.max(b.incidentsDeclared, b.incidentsResolved);
    if (val > maxValue) maxValue = val;
  }
  const yMax = Math.max(4, Math.ceil(maxValue * 1.2));

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (bucketInterval === '1h') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const chartHeight = size === 'main' ? 280 : 176;
  const paddingLeft = 32;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 28;
  const innerWidth = totalWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const slot = innerWidth / buckets.length;
  const barWidth = Math.max(4, Math.min(24, slot * 0.6));
  const yBase = paddingTop + innerHeight;
  const labelEvery = Math.ceil(buckets.length / (size === 'main' ? 8 : 4));

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null;

  const legend =
    type === 'alerts'
      ? [
          { label: 'Critical', color: COLOR.critical },
          { label: 'High', color: COLOR.high },
          { label: 'Medium and low', color: COLOR.other },
        ]
      : [
          { label: 'Declared', color: COLOR.declared },
          { label: 'Resolved', color: COLOR.resolved },
        ];

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Legend items={legend} />
      </CardHeader>

      <CardContent>
        <div ref={wrapRef} className="w-full">
          <svg width={totalWidth} height={chartHeight} role="img" aria-label={title} className="block select-none">
            {/* Horizontal grid */}
            {[0, 0.5, 1].map((ratio) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line x1={paddingLeft} y1={y} x2={totalWidth - paddingRight} y2={y} stroke={COLOR.grid} strokeWidth="1" />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill={COLOR.label} fontSize="11" fontFamily="var(--font-mono)">
                    {Math.round(yMax * ratio)}
                  </text>
                </g>
              );
            })}

            {buckets.map((b, i) => {
              const xCenter = paddingLeft + (i + 0.5) * slot;
              const xBar = xCenter - barWidth / 2;
              const dim = hoveredIndex !== null && hoveredIndex !== i;

              let bars: React.ReactNode;
              if (type === 'alerts') {
                const totalH = (b.alertsTotal / yMax) * innerHeight;
                const critH = (b.alertsCritical / yMax) * innerHeight;
                const highH = (b.alertsHigh / yMax) * innerHeight;
                const otherH = Math.max(0, totalH - critH - highH);
                bars =
                  b.alertsTotal === 0 ? (
                    <circle cx={xCenter} cy={yBase - 1} r="1.5" fill={COLOR.empty} />
                  ) : (
                    <>
                      {critH > 0 && <rect x={xBar} y={yBase - critH} width={barWidth} height={critH} fill={COLOR.critical} rx="2" />}
                      {highH > 0 && <rect x={xBar} y={yBase - critH - highH} width={barWidth} height={highH} fill={COLOR.high} rx="2" />}
                      {otherH > 0 && <rect x={xBar} y={yBase - critH - highH - otherH} width={barWidth} height={otherH} fill={COLOR.other} rx="2" />}
                    </>
                  );
              } else {
                const halfW = Math.max(3, (barWidth - 2) / 2);
                const decH = (b.incidentsDeclared / yMax) * innerHeight;
                const resH = (b.incidentsResolved / yMax) * innerHeight;
                bars = (
                  <>
                    {decH > 0 ? (
                      <rect x={xCenter - halfW - 1} y={yBase - decH} width={halfW} height={decH} fill={COLOR.declared} rx="2" />
                    ) : (
                      <circle cx={xCenter - halfW / 2 - 1} cy={yBase - 1} r="1.5" fill={COLOR.empty} />
                    )}
                    {resH > 0 ? (
                      <rect x={xCenter + 1} y={yBase - resH} width={halfW} height={resH} fill={COLOR.resolved} rx="2" />
                    ) : (
                      <circle cx={xCenter + halfW / 2 + 1} cy={yBase - 1} r="1.5" fill={COLOR.empty} />
                    )}
                  </>
                );
              }

              return (
                <g
                  key={b.timestamp}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity"
                  opacity={dim ? 0.4 : 1}
                >
                  <rect x={xCenter - slot / 2} y={paddingTop} width={slot} height={innerHeight} fill="transparent" />
                  {bars}
                  {(i % labelEvery === 0 || i === buckets.length - 1) && (
                    <text x={xCenter} y={chartHeight - 8} textAnchor="middle" fill={COLOR.label} fontSize="11" fontFamily="var(--font-mono)">
                      {formatTimestamp(b.timestamp)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover detail */}
        <div className="mt-3 flex h-8 items-center justify-between border-t border-white/8 pt-3 font-mono text-xs text-zinc-400">
          {hoveredBucket ? (
            <>
              <span className="text-zinc-300">
                {new Date(hoveredBucket.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              {type === 'alerts' ? (
                <span className="flex items-center gap-4">
                  <span className="text-zinc-100">{hoveredBucket.alertsTotal} alerts</span>
                  <span>{hoveredBucket.alertsCritical} critical</span>
                  <span>{hoveredBucket.alertsHigh} high</span>
                </span>
              ) : (
                <span className="flex items-center gap-4">
                  <span>{hoveredBucket.incidentsDeclared} declared</span>
                  <span>{hoveredBucket.incidentsResolved} resolved</span>
                </span>
              )}
            </>
          ) : (
            <span className="font-sans text-zinc-500">Hover a bar for details</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
