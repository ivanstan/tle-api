import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, Polygon } from '@react-google-maps/api'
import { parseTLE, propagate, dateToJD, calculateGST, eciToGeodetic, calculateVisibilityFootprint } from 'tle.js/dist/propagators'
import type { OrbitalElements } from 'tle.js/dist/propagators'
import TleClient from 'tle.js'
import type { TleModel } from 'tle.js'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { TlePopularProvider } from '../services/TlePopularProvider'
import { TleProvider } from '../services/TleProvider'
import { getColor } from '../services/ColorPalette'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'

// ─── Constants ────────────────────────────────────────────────────────────────
const UPDATE_INTERVAL_MS = 1000
const STEP_MS = 60_000
const ORBIT_COUNT       = 1   // total orbits rendered — half before, half after current position
const ORBIT_STEP_SECONDS = 60 // sample interval for ground-track polyline (seconds)
const SPEED_OPTIONS = [
  { label: '1×',    value: 1 },
  { label: '10×',   value: 10 },
  { label: '60×',   value: 60 },
  { label: '600×',  value: 600 },
  { label: '3600×', value: 3600 },
]

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: 20, lng: 0 }
const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeId: 'satellite',
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [{ elementType: 'labels', stylers: [{ visibility: 'simplified' }] }],
  minZoom: 2,
  restriction: {
    latLngBounds: { north: 85.05, south: -85.05, west: -180, east: 180 },
    strictBounds: true,
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TleRecord {
  id: number
  tle: TleModel
  elements: OrbitalElements
  color: string
}

interface Position {
  lat: number
  lng: number
  alt: number
}

interface SearchOption {
  satelliteId: number
  name: string
}

// ─── Module-level instances ───────────────────────────────────────────────────
const tleClient = new TleClient()
const popularProvider = new TlePopularProvider()
const tleProvider = new TleProvider()

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computePosition(elements: OrbitalElements, date: Date): Position | null {
  try {
    const jd = dateToJD(date)
    const tsince = (jd - elements.jdsatepoch) * 1440
    const result = propagate(elements, tsince)
    if (result.error) return null
    const gmst = calculateGST(jd)
    const geo = eciToGeodetic(result.state.x, result.state.y, result.state.z, gmst)
    return { lat: geo.latitude, lng: geo.longitude, alt: geo.altitude }
  } catch {
    return null
  }
}

type LatLng = { lat: number; lng: number }

/** Split a polyline into segments wherever it crosses the antimeridian (±180°). */
function splitAtAntimeridian(pts: LatLng[]): LatLng[][] {
  if (pts.length < 2) return pts.length ? [pts] : []
  const segs: LatLng[][] = []
  let cur: LatLng[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    if (Math.abs(pts[i].lng - pts[i - 1].lng) > 180) {
      segs.push(cur)
      cur = []
    }
    cur.push(pts[i])
  }
  segs.push(cur)
  return segs.filter((s) => s.length > 1)
}

// ─── Orbital markers ──────────────────────────────────────────────────────────

type OrbitalMarkerType = 'ascending-node' | 'descending-node' | 'periapsis' | 'apoapsis'

interface OrbitalMarker {
  lat: number
  lng: number
  alt: number
  type: OrbitalMarkerType
}

const ORBITAL_MARKER_STYLE: Record<OrbitalMarkerType, { letter: string; title: string }> = {
  'ascending-node':  { letter: 'AN', title: 'Ascending Node'  },
  'descending-node': { letter: 'DN', title: 'Descending Node' },
  'periapsis':       { letter: 'Pe', title: 'Periapsis'       },
  'apoapsis':        { letter: 'Ap', title: 'Apoapsis'        },
}

/** Build an SVG data-URL badge (circle with two-letter label). */
function markerIcon(letter: string, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">` +
    `<circle cx="16" cy="16" r="14" fill="${fill}" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>` +
    `<text x="16" y="20.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10.5" font-weight="bold" fill="white">${letter}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/**
 * Scan one complete orbit (10-second resolution) centred on simTime and return
 * the four key orbital markers.
 *
 * Periapsis / Apoapsis are only emitted when eccentricity > 0.005 to avoid
 * meaningless markers on near-circular orbits.
 */
function computeOrbitalMarkers(elements: OrbitalElements, simTime: Date): OrbitalMarker[] {
  const STEP_MS  = 10_000                                     // 10-second sample interval
  const periodMs = ((2 * Math.PI) / elements.no) * 60_000    // full orbital period in ms
  const nowMs    = simTime.getTime()
  const start    = nowMs - periodMs / 2
  const end      = nowMs + periodMs / 2

  type Sample = { lat: number; lng: number; alt: number }
  const pts: Sample[] = []
  for (let t = start; t <= end; t += STEP_MS) {
    const p = computePosition(elements, new Date(t))
    if (p) pts.push(p)
  }
  if (pts.length < 3) return []

  const markers: OrbitalMarker[] = []

  // ── Equator crossings ───────────────────────────────────────────────────────
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const latSpan = b.lat - a.lat
    if (Math.abs(latSpan) < 1e-9) continue

    if (a.lat < 0 && b.lat >= 0) {
      // Ascending node — interpolate to lat = 0
      const f   = -a.lat / latSpan
      const lng = a.lng + f * (b.lng - a.lng)
      markers.push({ lat: 0, lng, alt: a.alt + f * (b.alt - a.alt), type: 'ascending-node' })
    } else if (a.lat >= 0 && b.lat < 0) {
      // Descending node
      const f   = a.lat / latSpan
      const lng = a.lng + f * (b.lng - a.lng)
      markers.push({ lat: 0, lng, alt: a.alt + f * (b.alt - a.alt), type: 'descending-node' })
    }
  }

  // ── Altitude extremes (only meaningful for eccentric orbits) ────────────────
  const MIN_ECCENTRICITY = 0.005
  if (elements.ecco > MIN_ECCENTRICITY) {
    let minPt = pts[0], maxPt = pts[0]
    for (const p of pts) {
      if (p.alt < minPt.alt) minPt = p
      if (p.alt > maxPt.alt) maxPt = p
    }
    markers.push({ ...minPt, type: 'periapsis' })
    markers.push({ ...maxPt, type: 'apoapsis'  })
  }

  return markers
}

// ─── Day / Night terminator ───────────────────────────────────────────────────

/** Returns the geographic position of the sub-solar point (lat/lng in degrees). */
function getSunSubsolarPoint(date: Date): { lat: number; lng: number } {
  const D2R = Math.PI / 180
  const JD  = dateToJD(date)
  const n   = JD - 2451545.0                                      // days since J2000.0

  const L       = (280.46 + 0.9856474 * n) % 360                 // mean longitude (°)
  const g       = ((357.528 + 0.9856003 * n) % 360) * D2R        // mean anomaly (rad)
  const lambda  = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R  // ecliptic lon (rad)
  const epsilon = 23.439 * D2R                                     // obliquity (rad)

  const lat = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) / D2R
  const ra  = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))
  const GMST = (280.46061837 + 360.98564736629 * n) % 360         // Greenwich Mean Sidereal Time (°)

  let lng = (ra / D2R - GMST) % 360
  if (lng >  180) lng -= 360
  if (lng < -180) lng += 360

  return { lat, lng }
}

/**
 * Builds the night-side overlay as a single closed polygon ring.
 *
 * The polygon walks along the terminator from −180° to +180° longitude, then
 * back across the night pole. Because the path is a single non-self-
 * intersecting ring whose interior never crosses 90° of latitude in any single
 * column, Google Maps fills it unambiguously.
 *
 * Terminator latitude formula:
 *   sin(φ)sin(φ_sun) + cos(φ)cos(φ_sun)cos(Δλ) = 0
 *   → tan(φ) = −cos(φ_sun)cos(Δλ)/sin(φ_sun)
 */
function computeNightOverlay(sunLat: number, sunLng: number) {
  const D2R = Math.PI / 180
  const φs  = sunLat * D2R

  function termLat(lng: number): number {
    const dλ = (lng - sunLng) * D2R
    if (Math.abs(Math.sin(φs)) < 1e-6) {
      return Math.cos(dλ) >= 0 ? -89.9 : 89.9
    }
    return Math.atan(-Math.cos(φs) * Math.cos(dλ) / Math.sin(φs)) / D2R
  }

  const nightPoleLat = sunLat >= 0 ? -89.9 : 89.9
  const terminator: { lat: number; lng: number }[] = []
  for (let lng = -180; lng <= 180; lng += 2) {
    terminator.push({ lat: termLat(lng), lng })
  }

  const nightPolygon: { lat: number; lng: number }[] = [
    ...terminator,
    { lat: nightPoleLat, lng:  180 },
    { lat: nightPoleLat, lng: -180 },
  ]

  return { nightPolygon, terminator }
}

/**
 * Simplified sub-lunar point (accurate to ~1°).
 * Uses the low-precision Moon position from Meeus "Astronomical Algorithms" Ch. 22.
 */
function getMoonSublunarPoint(date: Date): { lat: number; lng: number } {
  const D2R = Math.PI / 180
  const JD  = dateToJD(date)
  const n   = JD - 2451545.0

  // Mean orbital elements (degrees)
  const L  = (218.316 + 13.176396 * n) % 360   // mean longitude
  const M  = (134.963 + 13.064993 * n) % 360   // mean anomaly
  const F  = (93.272  + 13.229350 * n) % 360   // argument of latitude

  // Ecliptic coordinates (degrees)
  const lambda = (L + 6.289 * Math.sin(M * D2R)) * D2R
  const beta   = (5.128 * Math.sin(F * D2R)) * D2R

  const epsilon = 23.439 * D2R

  const sinDec = Math.sin(beta) * Math.cos(epsilon) +
                 Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda)
  const lat = Math.asin(Math.max(-1, Math.min(1, sinDec))) / D2R

  const ra  = Math.atan2(
    Math.cos(beta) * Math.sin(lambda) * Math.cos(epsilon) - Math.sin(beta) * Math.sin(epsilon),
    Math.cos(beta) * Math.cos(lambda),
  )
  const GMST = (280.46061837 + 360.98564736629 * n) % 360
  let lng = (ra / D2R - GMST) % 360
  if (lng >  180) lng -= 360
  if (lng < -180) lng += 360

  return { lat, lng }
}

// ─── Custom SVG marker icons ──────────────────────────────────────────────────

function sunMarkerIcon(): string {
  // Rays: 8 directions from r=11 to r=15, center at (18,18)
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const r = Math.PI / 180 * deg
    const [x1, y1] = [18 + 11 * Math.cos(r), 18 + 11 * Math.sin(r)]
    const [x2, y2] = [18 + 15 * Math.cos(r), 18 + 15 * Math.sin(r)]
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/>`
  }).join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">` +
    `<circle cx="18" cy="18" r="16" fill="rgba(255,200,0,0.18)"/>` +
    rays +
    `<circle cx="18" cy="18" r="9" fill="#FFB300" stroke="rgba(255,255,255,0.85)" stroke-width="1.5"/>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function moonMarkerIcon(): string {
  // Crescent: white disc clipped, then dark overlay disc offset to form the crescent
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">` +
    `<defs><clipPath id="mc"><circle cx="17" cy="17" r="13"/></clipPath></defs>` +
    `<circle cx="17" cy="17" r="15" fill="#1A237E" stroke="rgba(200,220,255,0.35)" stroke-width="1"/>` +
    `<circle cx="17" cy="17" r="13" fill="#CFD8DC" clip-path="url(#mc)"/>` +
    `<circle cx="22" cy="14" r="11" fill="#1A237E" clip-path="url(#mc)"/>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/** Compute ORBIT_COUNT orbits of ground track centred on simTime, split into past/future segments. */
function computeGroundTrack(elements: OrbitalElements, simTime: Date) {
  // orbital period: elements.no is mean motion in rad/min
  const periodMs  = ((2 * Math.PI) / elements.no) * 60_000
  const halfMs    = (ORBIT_COUNT / 2) * periodMs
  const stepMs    = ORBIT_STEP_SECONDS * 1_000
  const nowMs     = simTime.getTime()

  const past: LatLng[]   = []
  const future: LatLng[] = []

  for (let t = nowMs - halfMs; t <= nowMs + halfMs; t += stepMs) {
    const pos = computePosition(elements, new Date(t))
    if (!pos) continue
    const pt = { lat: pos.lat, lng: pos.lng }
    if (t <= nowMs) past.push(pt)
    else future.push(pt)
  }

  // Ensure both segments meet exactly at the satellite's current position
  const now = computePosition(elements, simTime)
  if (now) {
    const nowPt = { lat: now.lat, lng: now.lng }
    past.push(nowPt)
    future.unshift(nowPt)
  }

  return {
    past:   splitAtAntimeridian(past),
    future: splitAtAntimeridian(future),
  }
}

function formatSimTime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return (
    `${months[date.getUTCMonth()]} ${p(date.getUTCDate())}, ${date.getUTCFullYear()}` +
    `  ${p(date.getUTCHours())}:${p(date.getUTCMinutes())}:${p(date.getUTCSeconds())} UTC`
  )
}

function formatAlt(km: number) { return `${km.toFixed(0)} km` }
function fmtCoord(deg: number, pos: string, neg: string) {
  return `${Math.abs(deg).toFixed(4)}° ${deg >= 0 ? pos : neg}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SatelliteMap = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // TLE data (fetched once per satellite ID change)
  const [tleRecords, setTleRecords] = useState<TleRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [errors, setErrors]         = useState<string[]>([])

  // Time simulation
  const [simTime, setSimTime]   = useState<Date>(() => new Date())
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed]         = useState(1)

  // Map / UI state
  const [selectedId, setSelectedId]       = useState<number | null>(null)
  const [mapInstance, setMapInstance]     = useState<google.maps.Map | null>(null)
  const [pickerAnchor, setPickerAnchor]   = useState<HTMLElement | null>(null)
  const [selectorInput, setSelectorInput] = useState('')
  const [selectorOptions, setSelectorOptions] = useState<SearchOption[]>([])
  const [selectorLoading, setSelectorLoading] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  })

  // ── URL helpers ─────────────────────────────────────────────────────────────
  const rawIds = searchParams.get('ids') ?? ''
  const satelliteIds = rawIds
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)

  const setIds = (ids: number[], replace = false) =>
    setSearchParams(ids.length ? { ids: ids.join(',') } : {}, { replace })

  // ── Playback interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(
      () => setSimTime((prev) => new Date(prev.getTime() + speed * UPDATE_INTERVAL_MS)),
      UPDATE_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [isPlaying, speed])

  // ── Day / Night overlay + celestial subpoints ────────────────────────────────
  const { nightPolygon, terminator, sunPos, moonPos } = useMemo(() => {
    try {
      const sunPos  = getSunSubsolarPoint(simTime)
      const moonPos = getMoonSublunarPoint(simTime)
      const { nightPolygon, terminator } = computeNightOverlay(sunPos.lat, sunPos.lng)
      console.log('[celestial]', { sunPos, moonPos, terminatorPts: terminator.length, nightPts: nightPolygon.length })
      return { nightPolygon, terminator, sunPos, moonPos }
    } catch (err) {
      console.error('[celestial overlay]', err)
      return {
        nightPolygon: [] as { lat: number; lng: number }[],
        terminator:   [] as { lat: number; lng: number }[],
        sunPos:  null as { lat: number; lng: number } | null,
        moonPos: null as { lat: number; lng: number } | null,
      }
    }
  }, [simTime])

  // Stable polygon/polyline option references — prevents @react-google-maps/api
  // from tearing down and recreating the overlay every tick.
  const nightOptions = useMemo<google.maps.PolygonOptions>(() => ({
    fillColor:     '#000820',
    fillOpacity:   0.5,
    strokeColor:   '#000820',
    strokeOpacity: 0,
    strokeWeight:  0,
    clickable:     false,
    geodesic:      false,
    zIndex:        0,
  }), [])

  const terminatorOptions = useMemo<google.maps.PolylineOptions>(() => ({
    strokeColor:   '#ffffff',
    strokeOpacity: 0.25,
    strokeWeight:  1.5,
    clickable:     false,
    geodesic:      false,
    zIndex:        1,
  }), [])

  const sunIcon  = useMemo(() => isLoaded ? ({
    path:         window.google.maps.SymbolPath.CIRCLE,
    scale:        12,
    fillColor:    '#FFB300',
    fillOpacity:  1,
    strokeColor:  '#FFF59D',
    strokeWeight: 3,
  }) : undefined, [isLoaded])

  const moonIcon = useMemo(() => isLoaded ? ({
    path:         window.google.maps.SymbolPath.CIRCLE,
    scale:        9,
    fillColor:    '#CFD8DC',
    fillOpacity:  1,
    strokeColor:  '#37474F',
    strokeWeight: 2,
  }) : undefined, [isLoaded])

  // ── Positions (local SGP4 — no API call every tick) ─────────────────────────
  const satellites = useMemo(
    () => tleRecords.map((rec) => {
      const pos   = computePosition(rec.elements, simTime)
      const track = computeGroundTrack(rec.elements, simTime)

      let footprint: { lat: number; lng: number }[] = []
      if (pos) {
        try {
          const fp = calculateVisibilityFootprint(
            { latitude: pos.lat, longitude: pos.lng, altitude: pos.alt },
          )
          footprint = fp.boundaryPoints.map((p) => ({ lat: p.latitude, lng: p.longitude }))
        } catch { /* satellite may have decayed */ }
      }

      const orbitalMarkers = computeOrbitalMarkers(rec.elements, simTime)

      return { ...rec, pos, track, footprint, orbitalMarkers }
    }),
    [tleRecords, simTime],
  )

  // ── TLE fetch (once per ID list change) ─────────────────────────────────────
  useEffect(() => {
    if (satelliteIds.length === 0) {
      let cancelled = false
      setLoading(true)
      setErrors([])
      popularProvider.get().then((members: any[]) => {
        if (cancelled) return
        setIds(members.slice(0, 3).map((s: any) => s.satelliteId), true)
      }).catch(() => {
        if (!cancelled) { setErrors(['Failed to load popular satellites']); setLoading(false) }
      })
      return () => { cancelled = true }
    }

    // Drop removed satellites immediately so their orbits vanish before the fetch completes
    setTleRecords((prev) => prev.filter((r) => satelliteIds.includes(r.id)))

    let cancelled = false
    setLoading(true)
    setErrors([])

    ;(async () => {
      const results: TleRecord[] = []
      const errs: string[] = []
      await Promise.allSettled(
        satelliteIds.map(async (id, index) => {
          try {
            const tle = await tleClient.record(id)
            const elements = parseTLE(tle.line1, tle.line2)
            results.push({ id, tle, elements, color: getColor(index) })
          } catch {
            errs.push(`Satellite ${id}: failed to fetch`)
          }
        }),
      )
      if (!cancelled) {
        results.sort((a, b) => satelliteIds.indexOf(a.id) - satelliteIds.indexOf(b.id))
        setTleRecords(results)
        setErrors(errs)
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds])

  // ── Map auto-fit ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance || satellites.length === 0) return
    const valid = satellites.filter((s) => s.pos)
    if (valid.length === 0) return
    if (valid.length === 1) {
      mapInstance.panTo({ lat: valid[0].pos!.lat, lng: valid[0].pos!.lng })
      mapInstance.setZoom(4)
    } else {
      const bounds = new window.google.maps.LatLngBounds()
      valid.forEach(({ pos }) => bounds.extend({ lat: pos!.lat, lng: pos!.lng }))
      mapInstance.fitBounds(bounds, 80)
    }
  }, [mapInstance, tleRecords]) // only fit when TLE records change, not every tick

  // ── Satellite search debounce ────────────────────────────────────────────────
  useEffect(() => {
    if (selectorInput.length < 2) { setSelectorOptions([]); return }
    const t = setTimeout(async () => {
      setSelectorLoading(true)
      try {
        const res = await tleProvider.search(selectorInput)
        setSelectorOptions(res.slice(0, 8).map((r) => ({ satelliteId: r.satelliteId, name: r.name })))
      } catch { setSelectorOptions([]) }
      finally { setSelectorLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [selectorInput])

  const onMapLoad = useCallback((m: google.maps.Map) => setMapInstance(m), [])
  const selectedSat = satellites.find((s) => s.id === selectedId) ?? null

  // ── Selector derived values ──────────────────────────────────────────────────
  const selectedOptions: SearchOption[] = satellites.map((s) => ({ satelliteId: s.id, name: s.tle.name }))
  const allOptions: SearchOption[] = [
    ...selectedOptions,
    ...selectorOptions.filter((o) => !satelliteIds.includes(o.satelliteId)),
  ]

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{
        background: 'rgba(10,14,26,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <Toolbar sx={{ gap: 1, minHeight: '64px !important', px: 2 }}>

          {/* Left – back + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flexShrink: 0 }}>
            <Tooltip title="Back to home">
              <IconButton href="#/" size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <SatelliteAltIcon sx={{ color: '#4aa564', fontSize: 18 }} />
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Satellite Map
            </Typography>
          </Box>

          {/* Center – clock + playback controls */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>

            {/* Playback */}
            <Tooltip title="Step back 1 min">
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}
                onClick={() => setSimTime((p) => new Date(p.getTime() - STEP_MS))}>
                <SkipPreviousIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <IconButton size="small" onClick={() => setIsPlaying((p) => !p)}
                sx={{ color: '#4aa564', bgcolor: 'rgba(74,165,100,0.12)', '&:hover': { bgcolor: 'rgba(74,165,100,0.22)' } }}>
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Step forward 1 min">
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}
                onClick={() => setSimTime((p) => new Date(p.getTime() + STEP_MS))}>
                <SkipNextIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Speed */}
            <Select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem', height: 28, ml: 0.5,
                color: '#4aa564', fontWeight: 700,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(74,165,100,0.4)' },
                '& .MuiSvgIcon-root': { color: '#4aa564' },
              }}
            >
              {SPEED_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.8rem' }}>{o.label}</MenuItem>
              ))}
            </Select>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.12)' }} />

            {/* Clock – click to open date picker */}
            <Tooltip title="Pick date / time">
              <Button
                size="small"
                onClick={(e) => { setIsPlaying(false); setPickerAnchor(e.currentTarget) }}
                sx={{
                  fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600,
                  color: isPlaying ? '#fff' : '#fdbc3a',
                  textTransform: 'none', px: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.09)' },
                  whiteSpace: 'nowrap',
                }}
              >
                {formatSimTime(simTime)}
              </Button>
            </Tooltip>

            {/* Go live */}
            <Tooltip title="Jump to current time and resume at 1×">
              <Button
                size="small"
                onClick={() => { setSimTime(new Date()); setSpeed(1); setIsPlaying(true) }}
                sx={{
                  ml: 0.5, px: 1.25, height: 28, minWidth: 0,
                  fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                  textTransform: 'none', letterSpacing: '0.05em',
                  color: '#4aa564', border: '1px solid rgba(74,165,100,0.5)',
                  borderRadius: 1,
                  '&::before': { content: '"●"', mr: 0.5, fontSize: '0.55rem', verticalAlign: 'middle' },
                  '&:hover': { bgcolor: 'rgba(74,165,100,0.15)', borderColor: '#4aa564' },
                }}
              >
                LIVE
              </Button>
            </Tooltip>
          </Box>

          {/* Right – satellite multiselect */}
          <Autocomplete<SearchOption, true>
            multiple
            disableCloseOnSelect
            options={allOptions}
            value={selectedOptions}
            getOptionLabel={(o) => o.name}
            loading={selectorLoading}
            inputValue={selectorInput}
            onInputChange={(_, val, reason) => { if (reason !== 'reset') setSelectorInput(val) }}
            onChange={(_, newValue) => { setIds(newValue.map((o) => o.satelliteId)); setSelectorInput('') }}
            filterOptions={(x) => x}
            noOptionsText={selectorInput.length < 2 ? 'Type to search…' : 'No results'}
            isOptionEqualToValue={(a, b) => a.satelliteId === b.satelliteId}
            sx={{ width: 340, flexShrink: 0 }}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={selectedOptions.length === 0 ? 'Select satellites…' : ''}
                size="small"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: selectedOptions.length > 0 && !selectorInput ? (
                      <Typography noWrap sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', pl: 0.5, maxWidth: 200, flexShrink: 1, pointerEvents: 'none' }}>
                        {selectedOptions.map((o) => o.name).join(', ')}
                      </Typography>
                    ) : null,
                    endAdornment: (
                      <>
                        {(selectorLoading || loading) && <CircularProgress size={14} sx={{ color: '#4aa564' }} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.06)', flexWrap: 'nowrap',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#4aa564' },
                  },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' },
                }}
              />
            )}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} sx={{ fontSize: '0.8rem' }}>
                <Checkbox checked={selected} size="small"
                  sx={{ mr: 0.5, p: 0.5, color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#4aa564' } }} />
                <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.7rem', flexShrink: 0 }}>
                  #{option.satelliteId}
                </Box>
                {option.name}
              </Box>
            )}
          />
        </Toolbar>
      </AppBar>

      {/* ── Date/time picker popover ───────────────────────────────────────── */}
      <Popover
        open={!!pickerAnchor}
        anchorEl={pickerAnchor}
        onClose={() => setPickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <DateTimePicker
            label="Simulation time (UTC)"
            value={simTime}
            onChange={(val) => { if (val) setSimTime(val) }}
            timezone="UTC"
            slotProps={{ textField: { size: 'small' } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5, gap: 1 }}>
            <Button size="small" onClick={() => setPickerAnchor(null)}>Close</Button>
            <Button size="small" variant="contained" color="primary"
              onClick={() => { setIsPlaying(true); setPickerAnchor(null) }}>
              Resume
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* ── Map area ───────────────────────────────────────────────────────── */}
      <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {loadError && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              Google Maps failed to load. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>.
            </Alert>
          </Box>
        )}

        {/* Sidebar */}
        <Paper elevation={4} sx={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          p: 2, minWidth: 230, maxWidth: 280, maxHeight: 'calc(100% - 32px)',
          overflowY: 'auto', bgcolor: 'background.paper', borderRadius: 2,
        }}>
          <Typography sx={{ mb: 1.5, fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.08em', color: 'text.secondary', textTransform: 'uppercase' }}>
            Live Positions
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
              <CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Loading…</Typography>
            </Box>
          )}

          {errors.map((err) => (
            <Alert key={err} severity="warning" sx={{ mb: 1, fontSize: '0.72rem', py: 0 }}>{err}</Alert>
          ))}

          {satellites.map((s) => {
            const isSelected = s.id === selectedId
            return (
              <Box key={s.id} onClick={() => setSelectedId(isSelected ? null : s.id)} sx={{
                mb: 1.25, p: 1.25, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                borderColor: isSelected ? s.color : 'divider',
                bgcolor: isSelected ? `${s.color}18` : 'transparent',
                transition: 'all 0.15s',
                '&:hover': { borderColor: s.color, bgcolor: `${s.color}10` },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    {s.tle.name}
                  </Typography>
                </Box>
                {s.pos ? (
                  <>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {fmtCoord(s.pos.lat, 'N', 'S')} · {fmtCoord(s.pos.lng, 'E', 'W')}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Alt: {formatAlt(s.pos.alt)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" color="error.main">Position unavailable</Typography>
                )}
              </Box>
            )
          })}

          {!loading && satellites.length > 0 && (
            <Typography sx={{ display: 'block', mt: 1, fontSize: '0.62rem', fontFamily: 'monospace', color: 'text.secondary' }}>
              {formatSimTime(simTime)}
            </Typography>
          )}
        </Paper>

        {/* Google Map */}
        {isLoaded && !loadError ? (
          <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={2}
            options={MAP_OPTIONS} onLoad={onMapLoad}>

            {/* Night hemisphere overlay */}
            {nightPolygon.length > 2 && (
              <Polygon paths={nightPolygon} options={nightOptions} />
            )}

            {/* Terminator line — day/night boundary */}
            {terminator.length > 1 && (
              <Polyline path={terminator} options={terminatorOptions} />
            )}

            {/* Solar subpoint */}
            {sunPos && (
              <Marker key="sun-marker"
                position={{ lat: sunPos.lat, lng: sunPos.lng }}
                title={`Sun — ${sunPos.lat.toFixed(2)}°, ${sunPos.lng.toFixed(2)}°`}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 14, fillColor: '#FFB300', fillOpacity: 1,
                  strokeColor: '#FFF59D', strokeWeight: 3,
                }}
              />
            )}

            {/* Lunar subpoint */}
            {moonPos && (
              <Marker key="moon-marker"
                position={{ lat: moonPos.lat, lng: moonPos.lng }}
                title={`Moon — ${moonPos.lat.toFixed(2)}°, ${moonPos.lng.toFixed(2)}°`}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10, fillColor: '#CFD8DC', fillOpacity: 1,
                  strokeColor: '#37474F', strokeWeight: 2,
                }}
              />
            )}

            {/* Visibility footprints — rendered first so they sit under everything */}
            {satellites.map((s) => s.footprint.length > 2 && (
              <Polygon
                key={`fp-${s.id}`}
                paths={s.footprint}
                options={{
                  fillColor:    s.color,
                  fillOpacity:  0.07,
                  strokeColor:  s.color,
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                  geodesic:     true,
                }}
              />
            ))}

            {/* Ground-track polylines — rendered before markers so they sit below */}
            {satellites.map((s) => (
              <span key={`track-${s.id}`}>
                {/* Past orbit — dimmer, thinner */}
                {s.track.past.map((seg, i) => (
                  <Polyline key={`${s.id}-p${i}`} path={seg} options={{
                    strokeColor:   s.color,
                    strokeOpacity: 0.35,
                    strokeWeight:  1.5,
                    geodesic:      true,
                  }} />
                ))}
                {/* Future orbit — bright, solid */}
                {s.track.future.map((seg, i) => (
                  <Polyline key={`${s.id}-f${i}`} path={seg} options={{
                    strokeColor:   s.color,
                    strokeOpacity: 0.85,
                    strokeWeight:  2.5,
                    geodesic:      true,
                  }} />
                ))}
              </span>
            ))}

            {/* Orbital markers (nodes, periapsis, apoapsis) */}
            {satellites.flatMap((s) =>
              s.orbitalMarkers.map((m, i) => {
                const style = ORBITAL_MARKER_STYLE[m.type]
                return (
                  <Marker
                    key={`${s.id}-om-${m.type}-${i}`}
                    position={{ lat: m.lat, lng: m.lng }}
                    title={`${s.tle.name} — ${style.title}\nAlt: ${m.alt.toFixed(0)} km`}
                    zIndex={4}
                    icon={{
                      url: markerIcon(style.letter, s.color),
                      scaledSize: new window.google.maps.Size(32, 32),
                      anchor:     new window.google.maps.Point(16, 16),
                    }}
                  />
                )
              })
            )}

            {satellites.filter((s) => s.pos).map((s) => (
              <Marker key={s.id}
                position={{ lat: s.pos!.lat, lng: s.pos!.lng }}
                title={s.tle.name}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 9, fillColor: s.color, fillOpacity: 1,
                  strokeColor: '#fff', strokeWeight: 2,
                }}
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
              />
            ))}

            {selectedSat?.pos && (
              <InfoWindow
                position={{ lat: selectedSat.pos.lat, lng: selectedSat.pos.lng }}
                onCloseClick={() => setSelectedId(null)}
              >
                <Box sx={{ color: '#000', minWidth: 180, p: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{selectedSat.tle.name}</Typography>
                  <Typography variant="body2">NORAD ID: {selectedSat.id}</Typography>
                  <Typography variant="body2">Lat: {selectedSat.pos.lat.toFixed(4)}°</Typography>
                  <Typography variant="body2">Lon: {selectedSat.pos.lng.toFixed(4)}°</Typography>
                  <Typography variant="body2">Alt: {formatAlt(selectedSat.pos.alt)}</Typography>
                  {selectedSat.footprint.length > 0 && (() => {
                    try {
                      const fp = calculateVisibilityFootprint({ latitude: selectedSat.pos.lat, longitude: selectedSat.pos.lng, altitude: selectedSat.pos.alt })
                      return <Typography variant="body2">Visible from: ~{fp.radiusKm.toFixed(0)} km radius</Typography>
                    } catch { return null }
                  })()}
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : !loadError && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Box>
  )
}
