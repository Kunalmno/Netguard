import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.tsx';
import type { TrendBucket } from '../../server/analytics/analytics.service.ts';

export interface AnalyticsTrendsChartProps {
  title: string;
  description: string;
  timeRange: '24h' | '7d' | '30d';
  bucketInterval: '1h' | '1d';
  buckets: TrendBucket[];
  type: 'alerts' | 'incidents';
}

export const AnalyticsTrendsChart: React.FC<AnalyticsTrendsChartProps> = ({
  title,
  description,
  timeRange,
  bucketInterval,
  buckets,
  type,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const uid = React.useId().replace(/:/g, '');

  if (!buckets || buckets.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="p-4 pb-2 border-b border-zinc-800">
          <CardTitle className="text-sm font-semibold text-zinc-100">{title}</CardTitle>
          <CardDescription className="text-xs text-zinc-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-zinc-500 font-mono">
          No trend data recorded for this window.
        </CardContent>
      </Card>
    );
  }

  // Calculate maximum value for Y-axis scale
  let maxValue = 1;
  for (const b of buckets) {
    const val = type === 'alerts' ? b.alertsTotal : Math.max(b.incidentsDeclared, b.incidentsResolved);
    if (val > maxValue) maxValue = val;
  }
  // Round up to nice number
  const yMax = Math.max(4, Math.ceil(maxValue * 1.2));

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (bucketInterval === '1h') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const chartHeight = 140;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;
  const totalWidth = 600;
  const innerWidth = totalWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.max(4, (innerWidth / buckets.length) * 0.7);

  const bucketLabel = (b: TrendBucket) =>
    type === 'alerts'
      ? `${formatTimestamp(b.timestamp)}: ${b.alertsTotal} alerts, ${b.alertsCritical} critical, ${b.alertsHigh} high`
      : `${formatTimestamp(b.timestamp)}: ${b.incidentsDeclared} incidents declared, ${b.incidentsResolved} resolved`;

  const totalAlerts = buckets.reduce((n, b) => n + b.alertsTotal, 0);
  const totalDeclared = buckets.reduce((n, b) => n + b.incidentsDeclared, 0);
  const totalResolved = buckets.reduce((n, b) => n + b.incidentsResolved, 0);
  const summaryText =
    type === 'alerts'
      ? `${title}. ${totalAlerts} alerts over ${timeRange} in ${buckets.length} intervals.`
      : `${title}. ${totalDeclared} incidents declared and ${totalResolved} resolved over ${timeRange}.`;

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative">
      <CardHeader className="p-4 pb-2 border-b border-zinc-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-100">{title}</CardTitle>
          <CardDescription className="text-xs text-zinc-400">{description}</CardDescription>
        </div>
        {type === 'alerts' ? (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-red-400">
              <span aria-hidden="true" className="h-2.5 w-2.5 bg-red-400" /> Critical (solid)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span aria-hidden="true" className="h-2.5 w-2.5 border border-amber-400 bg-[repeating-linear-gradient(45deg,var(--c-high)_0_2px,transparent_2px_5px)]" /> High (hatched)
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span aria-hidden="true" className="h-2.5 w-2.5 border-2 border-sky-400" /> Med/Low (outline)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-red-400">
              <span aria-hidden="true" className="h-2.5 w-2.5 bg-red-400" /> Declared (solid)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span aria-hidden="true" className="h-2.5 w-2.5 border border-emerald-400 bg-[repeating-linear-gradient(45deg,var(--c-ok)_0_2px,transparent_2px_5px)]" /> Resolved (hatched)
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-4">
        {/* SVG Histogram */}
        <figure className="w-full overflow-x-auto m-0">
          <figcaption className="sr-only">{summaryText}</figcaption>
          <svg
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            role="group"
            aria-label={summaryText}
            className="w-full min-w-[480px] h-36 overflow-visible select-none"
          >
            <defs>
              <pattern id={`${uid}-high`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="5" fill="var(--c-high-bg)" />
                <line x1="0" y1="0" x2="0" y2="5" stroke="var(--c-high)" strokeWidth="2.5" />
              </pattern>
              <pattern id={`${uid}-ok`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="5" fill="var(--c-ok-bg)" />
                <line x1="0" y1="0" x2="0" y2="5" stroke="var(--c-ok)" strokeWidth="2.5" />
              </pattern>
            </defs>
            {/* Horizontal Grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const labelVal = Math.round(yMax * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={totalWidth - paddingRight}
                    y2={y}
                    stroke="var(--c-border)"
                    strokeDasharray={ratio > 0 ? '3 3' : 'none'}
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="var(--c-text-3)"
                    className="text-xs font-mono"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {buckets.map((b, i) => {
              const xCenter = paddingLeft + (i + 0.5) * (innerWidth / buckets.length);
              const xBar = xCenter - barWidth / 2;

              if (type === 'alerts') {
                const totalH = (b.alertsTotal / yMax) * innerHeight;
                const critH = (b.alertsCritical / yMax) * innerHeight;
                const highH = (b.alertsHigh / yMax) * innerHeight;
                const otherH = Math.max(0, totalH - critH - highH);

                const yBase = paddingTop + innerHeight;
                const yCrit = yBase - critH;
                const yHigh = yCrit - highH;
                const yOther = yHigh - otherH;

                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={b.timestamp}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(i)}
                    onBlur={() => setHoveredIndex(null)}
                    tabIndex={0}
                    role="img"
                    aria-label={bucketLabel(b)}
                    className="cursor-pointer transition-opacity"
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.4}
                  >
                    {/* Hit target area */}
                    <rect
                      x={xCenter - innerWidth / buckets.length / 2}
                      y={paddingTop}
                      width={innerWidth / buckets.length}
                      height={innerHeight}
                      fill="transparent"
                    />

                    {b.alertsTotal === 0 ? (
                      <circle cx={xCenter} cy={yBase - 1} r="1" fill="var(--c-border-strong)" />
                    ) : (
                      <>
                        {critH > 0 && (
                          <rect
                            x={xBar}
                            y={yCrit}
                            width={barWidth}
                            height={critH}
                            fill="var(--c-crit)"
                            rx="1"
                          />
                        )}
                        {highH > 0 && (
                          <rect
                            x={xBar}
                            y={yHigh}
                            width={barWidth}
                            height={highH}
                            fill={`url(#${uid}-high)`} stroke="var(--c-high)" strokeWidth="1"
                            rx="1"
                          />
                        )}
                        {otherH > 0 && (
                          <rect
                            x={xBar}
                            y={yOther}
                            width={barWidth}
                            height={otherH}
                            fill="var(--c-low-bg)" stroke="var(--c-low)" strokeWidth="1.5"
                            rx="1"
                          />
                        )}
                      </>
                    )}

                    {/* X axis labels (sparse) */}
                    {(i % Math.ceil(buckets.length / 6) === 0 || i === buckets.length - 1) && (
                      <text
                        x={xCenter}
                        y={chartHeight - 6}
                        textAnchor="middle"
                        fill="var(--c-text-3)"
                        className="text-xs font-mono"
                      >
                        {formatTimestamp(b.timestamp)}
                      </text>
                    )}
                  </g>
                );
              } else {
                // Incidents Declared vs Resolved dual bar
                const halfW = Math.max(2, (barWidth - 1) / 2);
                const decH = (b.incidentsDeclared / yMax) * innerHeight;
                const resH = (b.incidentsResolved / yMax) * innerHeight;
                const yBase = paddingTop + innerHeight;

                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={b.timestamp}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(i)}
                    onBlur={() => setHoveredIndex(null)}
                    tabIndex={0}
                    role="img"
                    aria-label={bucketLabel(b)}
                    className="cursor-pointer transition-opacity"
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.4}
                  >
                    <rect
                      x={xCenter - innerWidth / buckets.length / 2}
                      y={paddingTop}
                      width={innerWidth / buckets.length}
                      height={innerHeight}
                      fill="transparent"
                    />

                    {/* Declared Bar */}
                    {decH > 0 ? (
                      <rect
                        x={xCenter - halfW - 0.5}
                        y={yBase - decH}
                        width={halfW}
                        height={decH}
                        fill="var(--c-crit)"
                        rx="1"
                      />
                    ) : (
                      <circle cx={xCenter - halfW / 2} cy={yBase - 1} r="1" fill="var(--c-border-strong)" />
                    )}

                    {/* Resolved Bar */}
                    {resH > 0 ? (
                      <rect
                        x={xCenter + 0.5}
                        y={yBase - resH}
                        width={halfW}
                        height={resH}
                        fill={`url(#${uid}-ok)`} stroke="var(--c-ok)" strokeWidth="1"
                        rx="1"
                      />
                    ) : (
                      <circle cx={xCenter + halfW / 2} cy={yBase - 1} r="1" fill="var(--c-border-strong)" />
                    )}

                    {/* X axis labels */}
                    {(i % Math.ceil(buckets.length / 6) === 0 || i === buckets.length - 1) && (
                      <text
                        x={xCenter}
                        y={chartHeight - 6}
                        textAnchor="middle"
                        fill="var(--c-text-3)"
                        className="text-xs font-mono"
                      >
                        {formatTimestamp(b.timestamp)}
                      </text>
                    )}
                  </g>
                );
              }
            })}
          </svg>
        </figure>

        <details className="mt-2 text-xs text-zinc-400">
          <summary className="cursor-pointer min-h-8 flex items-center">View chart data as table</summary>
          <div className="max-h-48 overflow-auto mt-1">
            <table className="w-full text-left font-mono">
              <caption className="sr-only">{title}</caption>
              <thead className="sticky top-0 bg-zinc-900">
                <tr>
                  <th scope="col" className="py-1 pr-3">Interval</th>
                  {type === 'alerts' ? (
                    <>
                      <th scope="col" className="py-1 pr-3 text-right">Total</th>
                      <th scope="col" className="py-1 pr-3 text-right">Critical</th>
                      <th scope="col" className="py-1 text-right">High</th>
                    </>
                  ) : (
                    <>
                      <th scope="col" className="py-1 pr-3 text-right">Declared</th>
                      <th scope="col" className="py-1 text-right">Resolved</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.timestamp} className="border-t border-zinc-800">
                    <th scope="row" className="py-1 pr-3 font-normal">{formatTimestamp(b.timestamp)}</th>
                    {type === 'alerts' ? (
                      <>
                        <td className="py-1 pr-3 text-right">{b.alertsTotal}</td>
                        <td className="py-1 pr-3 text-right">{b.alertsCritical}</td>
                        <td className="py-1 text-right">{b.alertsHigh}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-1 pr-3 text-right">{b.incidentsDeclared}</td>
                        <td className="py-1 text-right">{b.incidentsResolved}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Dynamic Hover Tooltip summary */}
        <div className="h-6 flex items-center justify-between text-xs font-mono text-zinc-400 px-2 pt-1 border-t border-zinc-800/60">
          {hoveredBucket ? (
            <>
              <span className="text-zinc-300">
                {new Date(hoveredBucket.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {type === 'alerts' ? (
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100">{hoveredBucket.alertsTotal} alerts</span>
                  <span className="text-red-400">{hoveredBucket.alertsCritical} crit</span>
                  <span className="text-amber-400">{hoveredBucket.alertsHigh} high</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-red-400">{hoveredBucket.incidentsDeclared} declared</span>
                  <span className="text-emerald-400">{hoveredBucket.incidentsResolved} resolved</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-500">Hover or focus a bar to inspect each interval</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
