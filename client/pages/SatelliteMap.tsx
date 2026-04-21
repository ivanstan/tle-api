import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { parseTLE, propagate, dateToJD, calculateGST, eciToGeodetic } from 'tle.js/dist/propagators'
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

  // ── Positions (local SGP4 — no API call every tick) ─────────────────────────
  const satellites = useMemo(
    () => tleRecords.map((rec) => ({ ...rec, pos: computePosition(rec.elements, simTime) })),
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
