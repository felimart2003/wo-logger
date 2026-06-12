import { useMemo, useRef, useState } from 'react'

export interface LinePoint {
  t: number
  v: number
  label?: string
}

interface LineChartProps {
  points: LinePoint[]
  height?: number
  formatValue?: (v: number) => string
  formatTime?: (t: number) => string
}

const W = 600

export function LineChart({ points, height = 220, formatValue, formatTime }: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fv = formatValue ?? ((v: number) => String(Math.round(v * 10) / 10))
  const ft = formatTime ?? ((t: number) =>
    new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))

  const pad = { l: 14, r: 14, t: 18, b: 26 }
  const H = height

  const { coords, minV, maxV } = useMemo(() => {
    if (points.length === 0) return { coords: [] as { x: number; y: number }[], minV: 0, maxV: 0 }
    const vs = points.map(p => p.v)
    let lo = Math.min(...vs)
    let hi = Math.max(...vs)
    if (hi === lo) { hi += 1; lo -= 1 }
    const span = hi - lo
    lo -= span * 0.08
    hi += span * 0.08
    const t0 = points[0].t
    const t1 = points[points.length - 1].t
    const tSpan = Math.max(1, t1 - t0)
    const coords = points.map(p => ({
      x: points.length === 1
        ? (pad.l + (W - pad.l - pad.r) / 2)
        : pad.l + ((p.t - t0) / tSpan) * (W - pad.l - pad.r),
      y: pad.t + (1 - (p.v - lo) / (hi - lo)) * (H - pad.t - pad.b),
    }))
    return { coords, minV: Math.min(...vs), maxV: Math.max(...vs) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, H])

  if (points.length === 0) {
    return <div className="chart-empty">No data yet</div>
  }

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `${path} L${coords[coords.length - 1].x.toFixed(1)},${H - pad.b} L${coords[0].x.toFixed(1)},${H - pad.b} Z`

  function onMove(e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    if (clientX == null) return
    const x = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x)
      if (d < bestDist) { bestDist = d; best = i }
    })
    setHover(best)
  }

  const h = hover != null ? { p: points[hover], c: coords[hover] } : null

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="line-chart"
        onMouseMove={onMove}
        onTouchStart={onMove}
        onTouchMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line
            key={f}
            x1={pad.l} x2={W - pad.r}
            y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)}
            className="chart-grid"
          />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={path} className="chart-line" fill="none" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={hover === i ? 5.5 : 3.5} className="chart-dot" />
        ))}
        {h && (
          <line x1={h.c.x} x2={h.c.x} y1={pad.t} y2={H - pad.b} className="chart-cursor" />
        )}
        <text x={pad.l} y={H - 8} className="chart-axis">{ft(points[0].t)}</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="chart-axis">
          {ft(points[points.length - 1].t)}
        </text>
        <text x={pad.l} y={12} className="chart-axis">max {fv(maxV)}</text>
        <text x={W - pad.r} y={12} textAnchor="end" className="chart-axis">min {fv(minV)}</text>
      </svg>
      {h && (
        <div className="chart-tooltip" style={{ left: `${(h.c.x / W) * 100}%` }}>
          <strong>{fv(h.p.v)}</strong>
          <span>{h.p.label ?? ft(h.p.t)}</span>
        </div>
      )}
    </div>
  )
}

export interface Bar {
  label: string
  value: number
}

export function BarChart({ bars, height = 140, formatValue }: {
  bars: Bar[]
  height?: number
  formatValue?: (v: number) => string
}) {
  const fv = formatValue ?? ((v: number) => String(v))
  const max = Math.max(1, ...bars.map(b => b.value))
  return (
    <div className="bar-chart" style={{ height }}>
      {bars.map((b, i) => (
        <div className="bar-col" key={i} title={`${b.label}: ${fv(b.value)}`}>
          <div className="bar-value">{b.value > 0 ? fv(b.value) : ''}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(b.value / max) * 100}%` }} />
          </div>
          <div className="bar-label">{b.label}</div>
        </div>
      ))}
    </div>
  )
}
