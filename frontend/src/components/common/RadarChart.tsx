import { type Ref } from "react";

interface RadarChartProps {
  values: number[];
  targets: number[];
  labels: string[];
  ref?: Ref<SVGSVGElement>;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 100;
const LEVELS = 3;

function polarToCartesian(
  angle: number,
  radius: number,
): { x: number; y: number } {
  // Start from top (-90 deg) and go clockwise
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function makePolygonPoints(
  ratios: number[],
  maxRadius: number,
): string {
  const step = 360 / ratios.length;
  return ratios
    .map((r, i) => {
      const { x, y } = polarToCartesian(i * step, r * maxRadius);
      return `${x},${y}`;
    })
    .join(" ");
}

export function RadarChart({ values, targets, labels, ref }: RadarChartProps) {
  const count = labels.length;
  const step = 360 / count;

  // Normalize values as % of target, capped at 150%
  const valueRatios = values.map((v, i) =>
    Math.min(v / (targets[i] || 1), 1.5),
  );
  // Target is always 100% (1.0)
  const targetRatios = targets.map(() => 1.0);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-[280px] mx-auto"
      role="img"
      aria-label="Macro radar chart"
    >
      {/* Grid levels */}
      {Array.from({ length: LEVELS }, (_, level) => {
        const r = (RADIUS * (level + 1)) / LEVELS;
        const points = Array.from({ length: count }, (_, i) => {
          const { x, y } = polarToCartesian(i * step, r);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const { x, y } = polarToCartesian(i * step, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Target polygon (gray dashed) */}
      <polygon
        points={makePolygonPoints(targetRatios, RADIUS)}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* Value polygon (emerald fill) */}
      <polygon
        points={makePolygonPoints(valueRatios, RADIUS)}
        fill="rgba(16, 185, 129, 0.2)"
        stroke="#10b981"
        strokeWidth="2"
      />

      {/* Value dots */}
      {valueRatios.map((r, i) => {
        const { x, y } = polarToCartesian(i * step, r * RADIUS);
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const { x, y } = polarToCartesian(i * step, RADIUS + 22);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6b7280"
            fontSize="10"
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
