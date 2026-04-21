/**
 * ElevationDial — arc-progress elevation gauge.
 *
 * Visually identical to CompassDial (same ring, arc weight, typography).
 *
 * Mapping:
 *   3 o'clock (right) = 0° horizon  →  12 o'clock (top) = 90° zenith
 *   The arc sweeps counter-clockwise from horizon to the current elevation.
 *   Negative elevations sweep clockwise (below the horizon reference).
 *
 * The thin dashed line at 3 o'clock marks the horizon.
 */
import React from 'react'
import { arcPath, clockPt } from './DialBase'

export interface ElevationDialProps {
  elevation: number   // degrees; positive = above horizon
  color?:    string
  size?:     number
}

export function ElevationDial({ elevation, color = '#4fc3f7', size = 110 }: ElevationDialProps) {
  const cx = size / 2, cy = size / 2
  const trackW = size * 0.07
  const r      = size / 2 - trackW

  // Clamp to ±90°
  const el      = Math.max(-90, Math.min(90, elevation))
  const isAbove = el >= 0
  const abs     = Math.abs(el)

  // Horizon is at 3 o'clock (clock = 90).
  // Zenith (+90°) is at 12 o'clock (clock = 0).   → sweep CCW by el degrees.
  // Nadir  (−90°) is at 6 o'clock (clock = 180).  → sweep CW  by |el| degrees.
  const horizonClock = 90
  const arcEndClock  = isAbove
    ? horizonClock - abs          // CCW toward top
    : horizonClock + abs          // CW toward bottom

  const arcD = abs > 0.5
    ? arcPath(cx, cy, r, horizonClock, arcEndClock, !isAbove)
    : ''

  const labelR = r + trackW * 0.55

  // Key positions
  const horizonPt = clockPt(cx, cy, labelR, horizonClock)  // 3-o'clock
  const zenithPt  = clockPt(cx, cy, labelR, 0)             // 12-o'clock
  const nadirPt   = clockPt(cx, cy, labelR, 180)           // 6-o'clock

  const arcColor = isAbove ? color : 'rgba(150,150,160,0.7)'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>

      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={trackW} />

      {/* Progress arc */}
      {arcD && (
        <path d={arcD}
          fill="none"
          stroke={arcColor}
          strokeWidth={trackW}
          strokeLinecap="round"
          opacity={0.9} />
      )}

      {/* Horizon reference dot */}
      {(() => {
        const p = clockPt(cx, cy, r, horizonClock)
        return <circle cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.6} />
      })()}

      {/* "HRZ" label at 3 o'clock */}
      <text x={horizonPt.x + size * 0.02} y={horizonPt.y}
        textAnchor="start" dominantBaseline="middle"
        fontSize={size * 0.075}
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
        fill={color}
        opacity={0.55}>
        HRZ
      </text>

      {/* "90°" label at top */}
      <text x={zenithPt.x} y={zenithPt.y - size * 0.01}
        textAnchor="middle" dominantBaseline="auto"
        fontSize={size * 0.075}
        fontFamily="system-ui, sans-serif"
        fill="rgba(255,255,255,0.3)">
        90°
      </text>

      {/* "−90°" label at bottom */}
      <text x={nadirPt.x} y={nadirPt.y + size * 0.01}
        textAnchor="middle" dominantBaseline="hanging"
        fontSize={size * 0.075}
        fontFamily="system-ui, sans-serif"
        fill="rgba(255,255,255,0.2)">
        −90°
      </text>

      {/* Centre – value */}
      <text x={cx} y={cy - size * 0.055}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.165}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill="rgba(255,255,255,0.92)">
        {el >= 0 ? '+' : ''}{el.toFixed(1)}°
      </text>

      {/* Centre – above / below label */}
      <text x={cx} y={cy + size * 0.1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.09}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill={arcColor}
        opacity={0.85}>
        {isAbove ? 'above' : 'below'}
      </text>

    </svg>
  )
}
