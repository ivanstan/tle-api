/**
 * Shared arc-path helper used by CompassDial and ElevationDial.
 * "Clock degrees": 0 = 12 o'clock, increases clockwise.
 */

/** Convert clock-degrees to SVG x,y on a circle of radius r centred at (cx,cy). */
export function clockPt(cx: number, cy: number, r: number, clockDeg: number) {
  const rad = ((clockDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/**
 * SVG arc path from startClock to endClock (clock-degrees).
 * cw=true  → clockwise sweep (SVG sweep-flag 1)
 * cw=false → counter-clockwise (SVG sweep-flag 0)
 * Pass full=true when you want a complete circle (arc degenerates otherwise).
 */
export function arcPath(
  cx: number, cy: number, r: number,
  startClock: number, endClock: number,
  cw = true, full = false,
): string {
  if (full) {
    // Two half-arcs to form a complete circle
    const top = clockPt(cx, cy, r, 0)
    const bot = clockPt(cx, cy, r, 180)
    return `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bot.x} ${bot.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y}`
  }
  const p1   = clockPt(cx, cy, r, startClock)
  const p2   = clockPt(cx, cy, r, endClock)
  const span = ((endClock - startClock) * (cw ? 1 : -1) + 360) % 360
  const large = span > 180 ? 1 : 0
  const sweep = cw ? 1 : 0
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}
