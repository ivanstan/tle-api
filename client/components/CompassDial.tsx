/**
 * CompassDial — arc-progress azimuth gauge.
 *
 * A thin grey ring forms the track. A thick colored arc fills clockwise from
 * North (top) to the current azimuth. Cardinal labels float around the ring.
 * The value and compass direction are displayed in the centre.
 */
import React from 'react'
import { arcPath, clockPt } from './DialBase'

export interface CompassDialProps {
  azimuth: number   // 0–360°
  color?:  string
  size?:   number   // outer diameter in px
}

const DIRS16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
const CARDINALS = [
  { label: 'N', clock: 0   },
  { label: 'E', clock: 90  },
  { label: 'S', clock: 180 },
  { label: 'W', clock: 270 },
]

export function CompassDial({ azimuth, color = '#4fc3f7', size = 110 }: CompassDialProps) {
  const cx = size / 2, cy = size / 2
  const trackW = size * 0.07          // stroke width for track + arc
  const r      = size / 2 - trackW   // arc radius (fits inside svg)

  // Normalise to [0, 360)
  const az = ((azimuth % 360) + 360) % 360

  // Arc from North CW to azimuth; if az < 0.5° show a tiny stub so it's visible
  const arcD = az < 0.5
    ? ''
    : arcPath(cx, cy, r, 0, az, true, az >= 359.5)

  // Label positions: slightly outside the arc
  const labelR = r + trackW * 0.55

  // 16-point compass name
  const compassLabel = DIRS16[Math.round(az / 22.5) % 16]

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
          stroke={color}
          strokeWidth={trackW}
          strokeLinecap="round"
          opacity={0.9} />
      )}

      {/* North tick – always visible as a reference */}
      {(() => {
        const p = clockPt(cx, cy, r, 0)
        return <circle cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.6} />
      })()}

      {/* Cardinal labels */}
      {CARDINALS.map(({ label, clock }) => {
        const p = clockPt(cx, cy, labelR, clock)
        return (
          <text key={label}
            x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={size * 0.085}
            fontFamily="system-ui, sans-serif"
            fontWeight={label === 'N' ? '700' : '400'}
            fill={label === 'N' ? color : 'rgba(255,255,255,0.3)'}
          >
            {label}
          </text>
        )
      })}

      {/* Centre – value */}
      <text x={cx} y={cy - size * 0.055}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.165}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill="rgba(255,255,255,0.92)">
        {az.toFixed(1)}°
      </text>

      {/* Centre – compass direction */}
      <text x={cx} y={cy + size * 0.1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.11}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill={color}
        opacity={0.85}>
        {compassLabel}
      </text>

    </svg>
  )
}
