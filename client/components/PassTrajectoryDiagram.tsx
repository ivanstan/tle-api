/**
 * Polar sky-plot showing a satellite's trajectory during a single overhead pass.
 *
 * Layout:
 *   - Centre   = zenith (90° elevation)
 *   - Edge     = horizon (0° elevation)
 *   - Dashed rings at 30° and 60° elevation
 *   - North at top, East at right
 *   - Filled circle = rise,  star-ring circle = max elevation,  open circle = set
 *   - Path is drawn solid when the satellite is sunlit, dashed when in Earth's shadow
 */
import React, { useMemo } from 'react'
import type { SatellitePass, SkyPoint } from 'tle.js/dist/propagators'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  pass:   SatellitePass
  /** Colour to use for the track and markers (defaults to a light-blue) */
  color?: string
  /** Outer diameter of the plot in px (default 200) */
  size?:  number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert (azimuth °, elevation °) to SVG (x, y) in the polar plot. */
function toXY(az: number, el: number, cx: number, cy: number, r: number) {
  const dist   = (1 - Math.max(0, Math.min(90, el)) / 90) * r
  const azRad  = (az * Math.PI) / 180
  return { x: cx + dist * Math.sin(azRad), y: cy - dist * Math.cos(azRad) }
}

/** Build an SVG path string from an array of {x,y} points. */
function pointsToPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/**
 * Split the skyPath into contiguous illuminated / shadowed segments so we can
 * style them differently (solid = sunlit, dashed = in shadow).
 */
function splitByIllumination(skyPath: SkyPoint[]) {
  const segments: { illuminated: boolean; pts: SkyPoint[] }[] = []
  let current: { illuminated: boolean; pts: SkyPoint[] } | null = null

  for (const pt of skyPath) {
    if (!current || current.illuminated !== pt.illuminated) {
      // Carry last point forward so segments join cleanly
      current = { illuminated: pt.illuminated, pts: current ? [current.pts[current.pts.length - 1], pt] : [pt] }
      segments.push(current)
    } else {
      current.pts.push(pt)
    }
  }
  return segments
}

// ── Component ─────────────────────────────────────────────────────────────────

const ELEVATION_RINGS = [0, 30, 60]
const CARDINALS = [
  { label: 'N', az: 0   },
  { label: 'E', az: 90  },
  { label: 'S', az: 180 },
  { label: 'W', az: 270 },
]

export function PassTrajectoryDiagram({ pass, color = '#4fc3f7', size = 200 }: Props) {
  const margin = 22          // px around the plot for labels / markers
  const cx     = size / 2
  const cy     = size / 2
  const r      = size / 2 - margin

  const segments = useMemo(() => splitByIllumination(pass.skyPath), [pass.skyPath])

  const riseXY = toXY(pass.riseAzimuth,         0,                      cx, cy, r)
  const maxXY  = toXY(pass.maxElevationAzimuth,  pass.maxElevation,      cx, cy, r)
  const setXY  = toXY(pass.setAzimuth,           0,                      cx, cy, r)

  // Direction arrow: pick the point ~60 % of the way through the sky path
  const arrowIdx  = Math.floor(pass.skyPath.length * 0.6)
  const arrowPrev = pass.skyPath[Math.max(0, arrowIdx - 1)]
  const arrowCurr = pass.skyPath[arrowIdx]
  const a0 = toXY(arrowPrev.azimuth, arrowPrev.elevation, cx, cy, r)
  const a1 = toXY(arrowCurr.azimuth, arrowCurr.elevation, cx, cy, r)
  const arrowAngle = Math.atan2(a1.y - a0.y, a1.x - a0.x) * (180 / Math.PI)

  const dim = `rgba(128,128,128,0.35)`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>

        {/* ── Elevation rings ───────────────────────────────────────────── */}
        {ELEVATION_RINGS.map((el) => {
          const ringR = (1 - el / 90) * r
          return (
            <circle
              key={el}
              cx={cx} cy={cy} r={ringR}
              fill="none"
              stroke={el === 0 ? dim : 'rgba(128,128,128,0.18)'}
              strokeWidth={el === 0 ? 1.2 : 0.8}
              strokeDasharray={el > 0 ? '4 3' : undefined}
            />
          )
        })}

        {/* ── Cross-hairs ───────────────────────────────────────────────── */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={dim} strokeWidth={0.5} />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={dim} strokeWidth={0.5} />

        {/* ── Elevation ring labels ─────────────────────────────────────── */}
        {[30, 60].map((el) => (
          <text
            key={el}
            x={cx + 3}
            y={cy - (1 - el / 90) * r - 3}
            fontSize={7.5} fill="rgba(160,160,160,0.8)" fontFamily="monospace"
          >
            {el}°
          </text>
        ))}

        {/* ── Cardinal labels ───────────────────────────────────────────── */}
        {CARDINALS.map(({ label, az }) => {
          const pos    = toXY(az, 0, cx, cy, r)
          const offset = margin * 0.55
          const ox     = az === 90  ? offset : az === 270 ? -offset : 0
          const oy     = az === 0   ? -offset : az === 180 ? offset  : 0
          return (
            <text
              key={label}
              x={pos.x + ox} y={pos.y + oy}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fill="rgba(180,180,180,0.9)" fontFamily="monospace" fontWeight="bold"
            >
              {label}
            </text>
          )
        })}

        {/* ── Satellite path (illuminated / shadow segments) ────────────── */}
        {segments.map((seg, i) => {
          const pts = seg.pts.map((p) => toXY(p.azimuth, p.elevation, cx, cy, r))
          return (
            <path
              key={i}
              d={pointsToPath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeOpacity={seg.illuminated ? 1 : 0.45}
              strokeDasharray={seg.illuminated ? undefined : '5 3'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* ── Direction arrow ───────────────────────────────────────────── */}
        {pass.skyPath.length > 2 && (
          <g transform={`translate(${a1.x},${a1.y}) rotate(${arrowAngle})`}>
            <polygon points="-6,-3.5 2,0 -6,3.5" fill={color} opacity={0.9} />
          </g>
        )}

        {/* ── Rise marker (filled circle) ───────────────────────────────── */}
        <circle cx={riseXY.x} cy={riseXY.y} r={4.5} fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />

        {/* ── Max elevation marker (double ring) ───────────────────────── */}
        <circle cx={maxXY.x} cy={maxXY.y} r={6}   fill={color}       stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} />
        <circle cx={maxXY.x} cy={maxXY.y} r={2.5} fill="rgba(255,255,255,0.9)" />

        {/* ── Set marker (open circle) ──────────────────────────────────── */}
        <circle cx={setXY.x} cy={setXY.y} r={4.5} fill="rgba(0,0,0,0.5)" stroke={color} strokeWidth={2} />

        {/* ── Zenith crosshair ──────────────────────────────────────────── */}
        <circle cx={cx} cy={cy} r={2} fill="rgba(128,128,128,0.5)" />

      </svg>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
        <LegendItem color={color} variant="filled"  label="Rise" />
        <LegendItem color={color} variant="double"  label={`Max ${pass.maxElevation.toFixed(1)}°`} />
        <LegendItem color={color} variant="open"    label="Set" />
        {pass.skyPath.some((p) => !p.illuminated) && (
          <LegendItem color={color} variant="shadow" label="In shadow" />
        )}
      </Box>
    </Box>
  )
}

// ── Legend helper ─────────────────────────────────────────────────────────────

type LegendVariant = 'filled' | 'double' | 'open' | 'shadow'

function LegendItem({ color, variant, label }: { color: string; variant: LegendVariant; label: string }) {
  const S = 12
  const cx = S / 2, cy = S / 2, r = S / 2 - 1

  const icon = (() => {
    switch (variant) {
      case 'filled': return <circle cx={cx} cy={cy} r={r} fill={color} />
      case 'double': return (
        <>
          <circle cx={cx} cy={cy} r={r}   fill={color} stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.9)" />
        </>
      )
      case 'open': return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.8} />
      case 'shadow': return (
        <line x1={1} y1={cy} x2={S - 1} y2={cy}
          stroke={color} strokeWidth={1.8} strokeOpacity={0.5} strokeDasharray="3 2" />
      )
    }
  })()

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <svg width={S} height={S}>{icon}</svg>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{label}</Typography>
    </Box>
  )
}
