import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, Polygon } from '@react-google-maps/api'
import { parseTLE, propagate, dateToJD, calculateGST, eciToGeodetic, calculateVisibilityFootprint, observe, createObserver } from 'tle.js/dist/propagators'
import type { OrbitalElements, LookAngles } from 'tle.js/dist/propagators'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MyLocationIcon from '@mui/icons-material/MyLocation'
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

  const nightPoleLat = sunLat >= 0 ? -89.5 : 89.5
  const terminator: { lat: number; lng: number }[] = []
  for (let lng = -179.99; lng <= 179.99; lng += 2) {
    terminator.push({ lat: termLat(lng), lng })
  }

  // Build a closed ring. CRITICAL: the pole "cap" is sampled in 5° steps so
  // each edge is short — a single edge from (lat, +180) directly to (lat, -180)
  // would be drawn by Google Maps as a straight pixel-line across the whole map
  // width (the wrong way around the world) and the polygon would not fill.
  const polePath: { lat: number; lng: number }[] = []
  for (let lng = 179.99; lng >= -179.99; lng -= 5) {
    polePath.push({ lat: nightPoleLat, lng })
  }

  const nightPolygon: { lat: number; lng: number }[] = sunLat >= 0
    ? [...terminator, ...polePath]                    // walk terminator W→E, then sweep south pole E→W
    : [...terminator.slice().reverse(), ...polePath.slice().reverse()] // mirror for southern sun

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

/** Compute `orbitCount` orbits of ground track centred on simTime, split into past/future segments. */
function computeGroundTrack(elements: OrbitalElements, simTime: Date, orbitCount: number) {
  // orbital period: elements.no is mean motion in rad/min
  const periodMs  = ((2 * Math.PI) / elements.no) * 60_000
  const halfMs    = (orbitCount / 2) * periodMs
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

// ─── localStorage settings hook ───────────────────────────────────────────────
function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s !== null ? (JSON.parse(s) as T) : initial
    } catch { return initial }
  })
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])
  return [val, set]
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
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [overlaysReady, setOverlaysReady] = useState(false)
  const [sidebarTab,  setSidebarTab]      = useState<'info' | 'settings'>('info')

  // ── Persisted settings ────────────────────────────────────────────────────
  const [showNightOverlay,   setShowNightOverlay]   = useLocalStorage('map.showNightOverlay',   true)
  const [nightOpacity,       setNightOpacity]        = useLocalStorage('map.nightOpacity',        0.5)
  const [showTerminator,     setShowTerminator]      = useLocalStorage('map.showTerminator',      true)
  const [showSunMoon,        setShowSunMoon]         = useLocalStorage('map.showSunMoon',         true)
  const [showOrbitalMarkers, setShowOrbitalMarkers]  = useLocalStorage('map.showOrbitalMarkers',  true)
  const [showFootprints,     setShowFootprints]      = useLocalStorage('map.showFootprints',      true)
  const [orbitCount,         setOrbitCount]          = useLocalStorage('map.orbitCount',          1)
  const [showEquator,        setShowEquator]         = useLocalStorage('map.showEquator',         false)
  const [showGreenwich,      setShowGreenwich]       = useLocalStorage('map.showGreenwich',       false)
  // Default observer: Berlin — overridden by geolocation on first visit
  const [observerPos, setObserverPos] = useLocalStorage<{ lat: number; lng: number }>(
    'map.observerPos', { lat: 52.52, lng: 13.405 },
  )

  // Detail-view drives the sidebar slide: 'list' | 'satellite' | 'observer'
  const [detailView, setDetailView] = useState<'list' | 'satellite' | 'observer'>('list')
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

  // ── Geolocation (run once, only if position was never personalised) ──────────
  useEffect(() => {
    const stored = localStorage.getItem('map.observerPos')
    if (stored) return // user already has a saved position, respect it
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setObserverPos({ lat: coords.latitude, lng: coords.longitude }),
      () => { /* denied / unavailable → keep Berlin default */ },
      { timeout: 8000, maximumAge: 0 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    fillOpacity:   nightOpacity,
    strokeColor:   '#000820',
    strokeOpacity: 0.01,
    strokeWeight:  1,
    clickable:     false,
    geodesic:      false,
    zIndex:        0,
  }), [nightOpacity])

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

  // Static reference lines (equator + Greenwich)
  const EQUATOR_PATH    = useMemo(() =>
    Array.from({ length: 361 }, (_, i) => ({ lat: 0, lng: i - 180 })), [])
  const GREENWICH_PATH  = useMemo(() =>
    Array.from({ length: 181 }, (_, i) => ({ lat: i - 90, lng: 0 })), [])
  const REF_LINE_OPTIONS = useMemo<google.maps.PolylineOptions>(() => ({
    strokeColor:   '#ef5350',
    strokeOpacity: 0.7,
    strokeWeight:  1.5,
    clickable:     false,
    geodesic:      false,
    zIndex:        2,
  }), [])

  // ── Positions (local SGP4 — no API call every tick) ─────────────────────────
  const satellites = useMemo(
    () => tleRecords.map((rec) => {
      const pos   = computePosition(rec.elements, simTime)
      const track = computeGroundTrack(rec.elements, simTime, orbitCount)

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
    [tleRecords, simTime, orbitCount],
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

  // ── Map auto-fit (removed) ────────────────────────────────────────────────

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

  const onMapLoad = useCallback((m: google.maps.Map) => {
    setMapInstance(m)
    // Wait for the first 'idle' event — fires when tiles are loaded and the
    // map is fully settled. Only after this point are overlays reliably painted.
    window.google.maps.event.addListenerOnce(m, 'idle', () => setOverlaysReady(true))
  }, [])
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
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Collapsible sidebar ──────────────────────────────────────────── */}
        <Box sx={{
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          transition: 'width 0.22s ease, min-width 0.22s ease',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Tab bar */}
          <Tabs
            value={sidebarTab}
            onChange={(_, v) => setSidebarTab(v)}
            variant="fullWidth"
            sx={{ minWidth: 260, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
          >
            <Tab label="Info"     value="info"     sx={{ fontSize: '0.78rem', minHeight: 40 }} />
            <Tab label="Settings" value="settings" sx={{ fontSize: '0.78rem', minHeight: 40 }} />
          </Tabs>

          {/* Info tab — three-panel slide (list / satellite detail / observer detail) */}
          {sidebarTab === 'info' && (
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', minWidth: 260 }}>

              {/* ── List panel ─────────────────────────────────────────────── */}
              <Box sx={{
                position: 'absolute', inset: 0, overflowY: 'auto', p: 2,
                transform: detailView !== 'list' ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 0.25s ease',
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

                {/* Observer entry */}
                <Box onClick={() => setDetailView('observer')} sx={{
                  mb: 1.25, p: 1.25, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                  borderColor: 'divider', transition: 'all 0.15s',
                  '&:hover': { borderColor: '#FF6B35', bgcolor: '#FF6B3510' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <MyLocationIcon sx={{ fontSize: 12, color: '#FF6B35', flexShrink: 0 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>Observer</Typography>
                  </Box>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {fmtCoord(observerPos.lat, 'N', 'S')} · {fmtCoord(observerPos.lng, 'E', 'W')}
                  </Typography>
                </Box>

                {satellites.map((s) => (
                  <Box key={s.id} onClick={() => { setSelectedId(s.id); setDetailView('satellite') }} sx={{
                    mb: 1.25, p: 1.25, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                    borderColor: 'divider', transition: 'all 0.15s',
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
                ))}

                {!loading && satellites.length > 0 && (
                  <Typography sx={{ display: 'block', mt: 1, fontSize: '0.62rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                    {formatSimTime(simTime)}
                  </Typography>
                )}
              </Box>

              {/* ── Detail panel (satellite or observer) ───────────────────── */}
              <Box sx={{
                position: 'absolute', inset: 0, overflowY: 'auto',
                transform: detailView !== 'list' ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.25s ease',
              }}>
                {/* ── Satellite detail ──────────────────────────────────────── */}
                {detailView === 'satellite' && selectedSat && (() => {
                  const R = Math.PI / 180
                  const el = selectedSat.elements
                  const n_rads = el.no / 60
                  const a = Math.pow(398600.4418 / (n_rads * n_rads), 1 / 3)
                  const perigeeKm = a * (1 - el.ecco) - 6371
                  const apogeeKm  = a * (1 + el.ecco) - 6371
                  const periodMin = (2 * Math.PI) / el.no
                  const epochDate = new Date(Date.UTC(el.epochYear, 0, 0) + el.epochDay * 86400000)

                  // Compute look angles from observer to this satellite
                  let lookAngles: LookAngles | null = null
                  let isVisible = false
                  try {
                    const jd = dateToJD(simTime)
                    const tsince = (jd - el.jdsatepoch) * 1440
                    const propResult = propagate(el, tsince)
                    if (!propResult.error) {
                      const obs = createObserver(observerPos.lat, observerPos.lng, 0)
                      const obsResult = observe(propResult, obs, jd)
                      lookAngles = obsResult.lookAngles
                      isVisible  = obsResult.visible
                    }
                  } catch { /* fallback: null */ }

                  const Row = ({ label, value }: { label: string; value: string }) => (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, mr: 1 }}>{label}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{value}</Typography>
                    </Box>
                  )

                  /** Compass direction label for an azimuth in degrees */
                  const azLabel = (az: number) => {
                    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
                    return dirs[Math.round(az / 22.5) % 16]
                  }

                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
                        <IconButton size="small" onClick={() => setDetailView('list')}>
                          <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: selectedSat.color, flexShrink: 0 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }} noWrap>
                          {selectedSat.tle.name}
                        </Typography>
                      </Box>

                      <Box sx={{ p: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                          Live Position
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {selectedSat.pos ? (
                            <>
                              <Row label="Latitude"  value={fmtCoord(selectedSat.pos.lat, 'N', 'S')} />
                              <Row label="Longitude" value={fmtCoord(selectedSat.pos.lng, 'E', 'W')} />
                              <Row label="Altitude"  value={formatAlt(selectedSat.pos.alt)} />
                              {selectedSat.footprint.length > 0 && (() => {
                                try {
                                  const fp = calculateVisibilityFootprint({ latitude: selectedSat.pos!.lat, longitude: selectedSat.pos!.lng, altitude: selectedSat.pos!.alt })
                                  return <Row label="Vis. radius" value={`~${fp.radiusKm.toFixed(0)} km`} />
                                } catch { return null }
                              })()}
                            </>
                          ) : (
                            <Typography variant="caption" color="error.main">Position unavailable</Typography>
                          )}
                        </Box>

                        {/* Look angles from observer */}
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                          Look Angles from Observer
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {lookAngles ? (
                            <>
                              {/* Visibility badge */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, mb: 0.5 }}>
                                <Box sx={{
                                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                  bgcolor: isVisible ? 'success.main' : 'text.disabled',
                                }} />
                                <Typography variant="caption" color={isVisible ? 'success.main' : 'text.secondary'}>
                                  {isVisible ? 'Visible above horizon' : 'Below horizon'}
                                </Typography>
                              </Box>
                              <Row label="Azimuth"    value={`${lookAngles.azimuth.toFixed(1)}° ${azLabel(lookAngles.azimuth)}`} />
                              <Row label="Elevation"  value={`${lookAngles.elevation.toFixed(2)}°`} />
                              <Row label="Range"      value={`${lookAngles.range.toFixed(1)} km`} />
                              <Row label="Range rate" value={`${lookAngles.rangeRate >= 0 ? '+' : ''}${lookAngles.rangeRate.toFixed(3)} km/s`} />
                            </>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Unavailable</Typography>
                          )}
                        </Box>

                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                          Orbital Elements
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Row label="NORAD ID"     value={String(el.satnum)} />
                          <Row label="Inclination"  value={`${(el.inclo / R).toFixed(4)}°`} />
                          <Row label="Eccentricity" value={el.ecco.toFixed(7)} />
                          <Row label="RAAN"         value={`${(el.nodeo / R).toFixed(4)}°`} />
                          <Row label="Arg. perigee" value={`${(el.argpo / R).toFixed(4)}°`} />
                          <Row label="Mean anomaly" value={`${(el.mo / R).toFixed(4)}°`} />
                          <Row label="Mean motion"  value={`${(el.no * 60 * 24 / (2 * Math.PI)).toFixed(8)} rev/day`} />
                          <Row label="Period"       value={`${Math.floor(periodMin / 60)}h ${(periodMin % 60).toFixed(1)}m`} />
                          <Row label="Perigee"      value={`${perigeeKm.toFixed(1)} km`} />
                          <Row label="Apogee"       value={`${apogeeKm.toFixed(1)} km`} />
                          <Row label="BSTAR"        value={el.bstar.toExponential(4)} />
                          <Row label="Rev. at epoch" value={String(el.revnum)} />
                          <Row label="Epoch"        value={epochDate.toISOString().slice(0, 19) + ' UTC'} />
                        </Box>
                      </Box>
                    </>
                  )
                })()}

                {/* ── Observer detail ───────────────────────────────────────── */}
                {detailView === 'observer' && (() => {
                  const Row = ({ label, value }: { label: string; value: string }) => (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, mr: 1 }}>{label}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', textAlign: 'right' }}>{value}</Typography>
                    </Box>
                  )
                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
                        <IconButton size="small" onClick={() => setDetailView('list')}>
                          <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <MyLocationIcon sx={{ fontSize: 14, color: '#FF6B35', flexShrink: 0 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>Observer</Typography>
                      </Box>

                      <Box sx={{ p: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                          Position
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Row label="Latitude"  value={fmtCoord(observerPos.lat, 'N', 'S')} />
                          <Row label="Longitude" value={fmtCoord(observerPos.lng, 'E', 'W')} />
                        </Box>

                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                          Satellites overhead
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {satellites.filter((s) => {
                            if (!s.pos || s.footprint.length === 0) return false
                            try {
                              const fp = calculateVisibilityFootprint({ latitude: s.pos.lat, longitude: s.pos.lng, altitude: s.pos.alt })
                              const dLat = observerPos.lat - s.pos.lat
                              const dLng = observerPos.lng - s.pos.lng
                              const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111.32
                              return distKm <= fp.radiusKm
                            } catch { return false }
                          }).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">None currently visible</Typography>
                          ) : (
                            satellites.filter((s) => {
                              if (!s.pos || s.footprint.length === 0) return false
                              try {
                                const fp = calculateVisibilityFootprint({ latitude: s.pos.lat, longitude: s.pos.lng, altitude: s.pos.alt })
                                const dLat = observerPos.lat - s.pos.lat
                                const dLng = observerPos.lng - s.pos.lng
                                const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111.32
                                return distKm <= fp.radiusKm
                              } catch { return false }
                            }).map((s) => (
                              <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{s.tle.name}</Typography>
                              </Box>
                            ))
                          )}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontStyle: 'italic' }}>
                          Drag the marker on the map to update the observer position.
                        </Typography>
                      </Box>
                    </>
                  )
                })()}
              </Box>

            </Box>
          )}

          {/* Settings tab */}
          {sidebarTab === 'settings' && (
            <Box sx={{ p: 2, overflowY: 'auto', flex: 1, minWidth: 260 }}>

              {/* Overlays */}
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                Overlays
              </Typography>
              <FormGroup sx={{ mt: 0.5, mb: 1 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showNightOverlay} onChange={(e) => setShowNightOverlay(e.target.checked)} />}
                  label={<Typography variant="body2">Night overlay</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={showTerminator} onChange={(e) => setShowTerminator(e.target.checked)} />}
                  label={<Typography variant="body2">Terminator line</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={showSunMoon} onChange={(e) => setShowSunMoon(e.target.checked)} />}
                  label={<Typography variant="body2">Sun / Moon subpoints</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={showEquator} onChange={(e) => setShowEquator(e.target.checked)} />}
                  label={<Typography variant="body2">Equatorial line</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={showGreenwich} onChange={(e) => setShowGreenwich(e.target.checked)} />}
                  label={<Typography variant="body2">Greenwich meridian</Typography>}
                />
              </FormGroup>

              {showNightOverlay && (
                <Box sx={{ px: 0.5, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Night opacity — {Math.round(nightOpacity * 100)}%
                  </Typography>
                  <Slider
                    size="small"
                    min={0.1} max={0.9} step={0.05}
                    value={nightOpacity}
                    onChange={(_, v) => setNightOpacity(v as number)}
                    sx={{ color: '#4aa564' }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Satellites */}
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                Satellites
              </Typography>
              <FormGroup sx={{ mt: 0.5, mb: 1 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showOrbitalMarkers} onChange={(e) => setShowOrbitalMarkers(e.target.checked)} />}
                  label={<Typography variant="body2">Orbital markers (AN/DN/Pe/Ap)</Typography>}
                />
                <FormControlLabel
                  control={<Switch size="small" checked={showFootprints} onChange={(e) => setShowFootprints(e.target.checked)} />}
                  label={<Typography variant="body2">Visibility footprints</Typography>}
                />
              </FormGroup>

              <Box sx={{ px: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Ground track — {orbitCount} orbit{orbitCount !== 1 ? 's' : ''}
                </Typography>
                <Slider
                  size="small"
                  min={0.5} max={5} step={0.5}
                  value={orbitCount}
                  onChange={(_, v) => setOrbitCount(v as number)}
                  marks
                  sx={{ color: '#4aa564' }}
                />
              </Box>

            </Box>
          )}
        </Box>

        {/* ── Map + collapse toggle ────────────────────────────────────────── */}
        <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar toggle tab */}
          <Box sx={{
            position: 'absolute', left: 0, top: '50%',
            transform: 'translateY(-50%)', zIndex: 20,
          }}>
            <IconButton
              onClick={() => setSidebarOpen((o) => !o)}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                borderRadius: '0 6px 6px 0',
                border: '1px solid',
                borderLeft: 'none',
                borderColor: 'divider',
                width: 20, height: 48,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </Box>

        {loadError && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              Google Maps failed to load. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>.
            </Alert>
          </Box>
        )}

        {/* Google Map */}
        {isLoaded && !loadError ? (
          <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={2}
            options={MAP_OPTIONS} onLoad={onMapLoad}>

            {/* All overlays are gated on overlaysReady (set on first map 'idle'
                event) so they only mount once Google Maps has fully settled and
                can reliably paint every overlay — including those restored from
                localStorage on the very first render. */}
            {overlaysReady && <>

            {/* Night hemisphere overlay */}
            {showNightOverlay && nightPolygon.length > 2 && (
              <Polygon paths={nightPolygon} options={nightOptions} />
            )}

            {/* Terminator line */}
            {showTerminator && terminator.length > 1 && (
              <Polyline path={terminator} options={terminatorOptions} />
            )}

            {/* Reference lines */}
            {showEquator   && <Polyline path={EQUATOR_PATH}   options={REF_LINE_OPTIONS} />}
            {showGreenwich && <Polyline path={GREENWICH_PATH} options={REF_LINE_OPTIONS} />}

            {/* Solar subpoint */}
            {showSunMoon && sunPos && (
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
            {showSunMoon && moonPos && (
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

            {/* Visibility footprints */}
            {showFootprints && satellites.map((s) => s.footprint.length > 2 && (
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
            {showOrbitalMarkers && satellites.flatMap((s) =>
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
                onClick={() => {
                  setSelectedId(s.id === selectedId ? null : s.id)
                  if (s.id !== selectedId) { setSidebarOpen(true); setDetailView('satellite') }
                }}
              />
            ))}

            {/* Observer marker — draggable, distinct orange pin */}
            <Marker
              key="observer"
              position={observerPos}
              draggable
              title={`Observer — drag to move\n${fmtCoord(observerPos.lat, 'N', 'S')}, ${fmtCoord(observerPos.lng, 'E', 'W')}`}
              zIndex={50}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: '#FF6B35',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 1.5,
                scale: 1.6,
                anchor: new window.google.maps.Point(12, 22),
              }}
              onDragEnd={(e) => {
                if (e.latLng) setObserverPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })
              }}
              onClick={() => { setSidebarOpen(true); setDetailView('observer') }}
            />

            </>} {/* end mapInstance guard */}
          </GoogleMap>
        ) : !loadError && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        </Box> {/* end inner map Box */}
      </Box>   {/* end flex row (sidebar + map) */}
    </Box>
  )
}
