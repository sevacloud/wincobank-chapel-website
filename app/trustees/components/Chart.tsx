/**
 * Thin Chart.js wrapper for the trustee dashboard
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Colour rules (validated categorical palette, light mode):
 * - Series colours come from SERIES in fixed slot order and follow the
 *   entity via `slot`, so filtering accounts never repaints the survivors.
 * - Three slots sit below 3:1 contrast on white, so every chart on the
 *   dashboard is paired with a data table showing the same figures.
 * - Text (ticks, legend, tooltip) stays in neutral ink, never series colour.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { formatGBP } from '@/lib/quickfile/format';

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

export interface Series {
  label: string;
  data: number[];
  /** Fixed palette slot for this entity (defaults to its index). */
  slot?: number;
}

interface Props {
  type: 'line' | 'bar';
  labels: string[];
  series: Series[];
  ariaLabel: string;
  height?: number;
}

const INK = '#52514e';
const GRID = '#ececea';

export default function Chart({ type, labels, series, ariaLabel, height = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let chart: ChartJS | undefined;
    let cancelled = false;

    import('chart.js/auto').then(({ default: ChartCtor }) => {
      if (cancelled || !canvasRef.current) return;
      chart = new ChartCtor(canvasRef.current, {
        type,
        data: {
          labels,
          datasets: series.map((s, i) => {
            const colour = SERIES[(s.slot ?? i) % SERIES.length];
            return type === 'line'
              ? {
                  label: s.label,
                  data: s.data,
                  borderColor: colour,
                  backgroundColor: colour,
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                }
              : {
                  label: s.label,
                  data: s.data,
                  backgroundColor: colour,
                  borderRadius: 4,
                  borderSkipped: 'start' as const,
                  // 2px surface gap between adjacent bars.
                  borderColor: '#ffffff',
                  borderWidth: { left: 1, right: 1 },
                  maxBarThickness: 28,
                };
          }),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            // A single series is named by the card title; legends only for 2+.
            legend: { display: series.length > 1, position: 'top', labels: { color: INK, usePointStyle: true } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatGBP(ctx.parsed.y)}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: INK } },
            y: {
              beginAtZero: true,
              grid: { color: GRID },
              border: { display: false },
              ticks: { color: INK, callback: (v) => formatGBP(Number(v)) },
            },
          },
        },
      });
    });

    return () => {
      cancelled = true;
      chart?.destroy();
    };
  }, [type, labels, series]);

  return (
    <div style={{ height }} className="relative">
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  );
}
