import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowSelectionModel, GridRenderCellParams } from '@mui/x-data-grid'
import {
  Drawer,
  IconButton,
  InputAdornment,
  TextField,
  Chip,
  Box,
} from '@mui/material'
import { When } from 'react-if'
import { TleBrowser } from '../components/TleBrowser'
import styled from 'styled-components'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import SearchIcon from '@mui/icons-material/Search'
import PublicIcon from '@mui/icons-material/Public'
import SyncIcon from '@mui/icons-material/Sync'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TripOriginIcon from '@mui/icons-material/TripOrigin'
import LanguageIcon from '@mui/icons-material/Language'
import FlightIcon from '@mui/icons-material/Flight'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SpeedIcon from '@mui/icons-material/Speed'
import FiberNewIcon from '@mui/icons-material/FiberNew'
import { TleProvider } from '../services/TleProvider'

// Map machine names to human-readable titles
const TAG_TITLES: Record<string, string> = {
  // Orbit types
  geostationaryOrbit: 'Geostationary',
  geosynchronousOrbit: 'Geosynchronous',
  circularOrbit: 'Circular',
  ellipticalOrbit: 'Elliptical',
  lowEarthOrbit: 'LEO',
  mediumEarthOrbit: 'MEO',
  highEarthOrbit: 'HEO',
  polarOrbit: 'Polar',
  sunSynchronousOrbit: 'Sun-Sync',
  molniyaOrbit: 'Molniya',
  tundraOrbit: 'Tundra',
  criticalInclinationOrbit: 'Critical Inc.',
  posigradeOrbit: 'Prograde',
  retrogradeOrbit: 'Retrograde',
  decayingOrbit: 'Decaying',
  lowDrag: 'Low Drag',
  // Classification
  classifiedSatellite: 'Classified',
  unclassifiedSatellite: 'Unclassified',
  recentTle: 'Recent',
}

// Map machine names to Material-UI icons
const TAG_ICONS: Record<string, React.ComponentType> = {
  // Orbit types
  geostationaryOrbit: PublicIcon,
  geosynchronousOrbit: SyncIcon,
  circularOrbit: RadioButtonUncheckedIcon,
  ellipticalOrbit: TripOriginIcon,
  lowEarthOrbit: LanguageIcon,
  mediumEarthOrbit: FlightIcon,
  highEarthOrbit: RocketLaunchIcon,
  polarOrbit: AcUnitIcon,
  sunSynchronousOrbit: WbSunnyIcon,
  molniyaOrbit: RocketLaunchIcon,
  tundraOrbit: RocketLaunchIcon,
  criticalInclinationOrbit: TrendingDownIcon,
  posigradeOrbit: TrendingDownIcon,
  retrogradeOrbit: TrendingDownIcon,
  decayingOrbit: TrendingDownIcon,
  lowDrag: SpeedIcon,
  // Classification
  classifiedSatellite: LockIcon,
  unclassifiedSatellite: LockOpenIcon,
  recentTle: FiberNewIcon,
}

// Map machine names to colors
const TAG_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  // Orbit types
  geostationaryOrbit: 'primary',
  geosynchronousOrbit: 'primary',
  circularOrbit: 'info',
  ellipticalOrbit: 'info',
  lowEarthOrbit: 'success',
  mediumEarthOrbit: 'success',
  highEarthOrbit: 'success',
  polarOrbit: 'info',
  sunSynchronousOrbit: 'warning',
  molniyaOrbit: 'secondary',
  tundraOrbit: 'secondary',
  criticalInclinationOrbit: 'default',
  posigradeOrbit: 'info',
  retrogradeOrbit: 'info',
  decayingOrbit: 'error',
  lowDrag: 'success',
  // Classification
  classifiedSatellite: 'error',
  unclassifiedSatellite: 'success',
  recentTle: 'warning',
}

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`

const Toolbar = styled.div`
  padding: 10px 0 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const DrawerContent = styled.div`
  background: #0f1628;
  height: 100%;
`

const DrawerHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const FilterSection = styled.div`
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`

const FilterSectionTitle = styled.h3`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px;
  
  &::before {
    content: '//';
    margin-right: 8px;
    opacity: 0.5;
  }
`

const FilterPillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 768px) {
    gap: 6px;
  }
`

// All available filter options
const ORBIT_FILTERS = [
  { key: 'lowEarthOrbit', label: 'LEO', icon: LanguageIcon, color: 'success' as const },
  { key: 'mediumEarthOrbit', label: 'MEO', icon: FlightIcon, color: 'success' as const },
  { key: 'highEarthOrbit', label: 'HEO', icon: RocketLaunchIcon, color: 'success' as const },
  { key: 'geostationaryOrbit', label: 'Geostationary', icon: PublicIcon, color: 'primary' as const },
  { key: 'geosynchronousOrbit', label: 'Geosynchronous', icon: SyncIcon, color: 'primary' as const },
  { key: 'polarOrbit', label: 'Polar', icon: AcUnitIcon, color: 'info' as const },
  { key: 'sunSynchronousOrbit', label: 'Sun-Sync', icon: WbSunnyIcon, color: 'warning' as const },
  { key: 'circularOrbit', label: 'Circular', icon: RadioButtonUncheckedIcon, color: 'info' as const },
  { key: 'ellipticalOrbit', label: 'Elliptical', icon: TripOriginIcon, color: 'info' as const },
  { key: 'molniyaOrbit', label: 'Molniya', icon: RocketLaunchIcon, color: 'secondary' as const },
  { key: 'tundraOrbit', label: 'Tundra', icon: RocketLaunchIcon, color: 'secondary' as const },
  { key: 'retrogradeOrbit', label: 'Retrograde', icon: TrendingDownIcon, color: 'info' as const },
  { key: 'posigradeOrbit', label: 'Prograde', icon: TrendingDownIcon, color: 'info' as const },
  { key: 'decayingOrbit', label: 'Decaying', icon: TrendingDownIcon, color: 'error' as const },
  { key: 'lowDrag', label: 'Low Drag', icon: SpeedIcon, color: 'success' as const },
  { key: 'recentTle', label: 'Recent', icon: FiberNewIcon, color: 'warning' as const },
]

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':')
}

const getColumns = (isMobile: boolean, activeFilters: Set<string>, onTagClick: (tagKey: string) => void): GridColDef[] => [
  {
    field: 'name',
    headerName: 'Name',
    type: 'string',
    flex: isMobile ? 0 : undefined,
    width: isMobile ? 150 : 200,
    minWidth: isMobile ? 150 : 200,
    disableColumnMenu: true,
  },
  {
    field: 'tags',
    headerName: 'Tags',
    flex: 1,
    minWidth: isMobile ? 200 : 300,
    sortable: false,
    disableColumnMenu: true,
    renderCell: (params: GridRenderCellParams) => {
      const tags: Array<{ key: string; title: string; icon: React.ComponentType; color: string }> = []
      
      // Process orbit fields
      if (params.row.orbit) {
        Object.entries(params.row.orbit).forEach(([key, value]) => {
          if (value === true && TAG_TITLES[key]) {
            tags.push({
              key,
              title: TAG_TITLES[key],
              icon: TAG_ICONS[key],
              color: TAG_COLORS[key] || 'default',
            })
          }
        })
      }
      
      // Process classification fields
      if (params.row.classification) {
        Object.entries(params.row.classification).forEach(([key, value]) => {
          if (value === true && TAG_TITLES[key]) {
            tags.push({
              key,
              title: TAG_TITLES[key],
              icon: TAG_ICONS[key],
              color: TAG_COLORS[key] || 'default',
            })
          }
        })
      }
      
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
          {tags.map((tag) => {
            const IconComponent = tag.icon
            const isActive = activeFilters.has(tag.key)
            return (
              <Chip
                key={tag.key}
                icon={<IconComponent style={{ fontSize: isMobile ? '0.9rem' : '1rem' }} />}
                label={tag.title}
                size={isMobile ? 'small' : 'small'}
                color={tag.color as any}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick(tag.key)
                }}
                sx={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  height: isMobile ? '20px' : '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                  '& .MuiChip-label': {
                    padding: isMobile ? '0 6px' : '0 8px',
                  },
                  '& .MuiChip-icon': {
                    marginLeft: isMobile ? '4px' : '5px',
                    marginRight: isMobile ? '-2px' : '-4px',
                  },
                  ...(isActive && {
                    fontWeight: 'bold',
                    borderWidth: '2px',
                  }),
                }}
              />
            )
          })}
        </Box>
      )
    },
  },
  ...(!isMobile ? [{
    field: 'inclination',
    headerName: 'Inclination',
    width: 130,
    sortable: true,
    disableColumnMenu: true,
    filterable: true,
    valueGetter: (_value, row) => {
      const value = row.extra?.inclination
      return value != null ? value.toFixed(2) + '°' : '-'
    },
  },
  {
    field: 'eccentricity',
    headerName: 'Eccentricity',
    width: 130,
    valueGetter: (_value, row) => {
      return row.extra?.eccentricity ?? '-'
    },
    disableColumnMenu: true,
    sortable: true,
  }] : []),
  ...(!isMobile ? [{
    field: 'semi_major_axis',
    headerName: 'Semi Major Axis',
    width: 250,
    valueGetter: (_value, row) => {
      const value = row.extra?.semi_major_axis
      return value != null ? (parseFloat(value) / 1000).toFixed(2) : '-'
    },
    disableColumnMenu: true,
    sortable: true,
  },
  {
    field: 'period',
    headerName: 'Period',
    type: 'string',
    width: 250,
    valueGetter: (_value, row) => {
      const value = row.extra?.period
      return value != null ? formatTime(value) : '-'
    },
    disableColumnMenu: true,
    sortable: true,
  },
  {
    field: 'raan',
    headerName: 'RAAN',
    type: 'string',
    width: 250,
    valueGetter: (_value, row) => {
      const value = row.extra?.raan
      return value != null ? value.toFixed(2) + '°' : '-'
    },
    disableColumnMenu: true,
    sortable: true,
  }] : []),
]

const TleBrowserWrapper = styled.div`
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`

const URL = 'https://tle.ivanstanojevic.me'

const provider = new TleProvider()

// DataGrid dark theme with zebra rows
const getDataGridStyles = (isMobile: boolean) => ({
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: isMobile ? '8px' : '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  '& .MuiDataGrid-columnHeaderTitle': {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: 600,
    fontSize: isMobile ? '0.7rem' : '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    fontFamily: '"IBM Plex Sans", sans-serif',
    fontSize: isMobile ? '0.85rem' : '1rem',
    color: 'rgba(255, 255, 255, 0.85)',
    display: 'flex',
    alignItems: 'center',
  },
  
  '& .MuiDataGrid-row': {
    maxHeight: 'none !important',
  },
  
  '& .MuiDataGrid-cell--withRenderer': {
    alignItems: 'flex-start',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  
  // Zebra striping - alternating row colors
  '& .MuiDataGrid-row:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  
  '& .MuiDataGrid-row:nth-of-type(even)': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'rgba(74, 165, 100, 0.1)',
  },
  
  '& .MuiDataGrid-row.Mui-selected': {
    backgroundColor: 'rgba(74, 165, 100, 0.15)',
    '&:hover': {
      backgroundColor: 'rgba(74, 165, 100, 0.2)',
    },
  },
  
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    minHeight: isMobile ? '52px' : 'auto',
  },
  
  '& .MuiTablePagination-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: isMobile ? '0.75rem' : '1rem',
    overflow: 'hidden',
  },
  
  '& .MuiTablePagination-toolbar': {
    minHeight: isMobile ? '52px' : '52px',
    paddingLeft: isMobile ? '8px' : '16px',
    paddingRight: isMobile ? '4px' : '16px',
  },
  
  '& .MuiTablePagination-selectLabel': {
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    margin: 0,
  },
  
  '& .MuiTablePagination-displayedRows': {
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    margin: 0,
  },
  
  '& .MuiTablePagination-select': {
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    paddingRight: '24px',
  },
  
  '& .MuiTablePagination-selectIcon': {
    color: 'rgba(255, 255, 255, 0.5)',
    right: 0,
  },
  
  '& .MuiTablePagination-actions': {
    marginLeft: isMobile ? '8px' : '20px',
  },
  
  '& .MuiIconButton-root': {
    color: 'rgba(255, 255, 255, 0.6)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    '&.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.2)',
    },
  },
  
  '& .MuiDataGrid-sortIcon': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
  },
  
  '& .MuiCircularProgress-root': {
    color: '#4aa564',
  },
  
  '& .MuiDataGrid-columnSeparator': {
    color: 'rgba(255, 255, 255, 0.1)',
  },
})

// TextField styles for dark theme
const getTextFieldStyles = (isMobile: boolean) => ({
  width: isMobile ? '100%' : 260,
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(74, 165, 100, 0.5)',
    },
    '&:before, &:after': {
      display: 'none',
    },
  },
  '& .MuiFilledInput-input': {
    color: '#ffffff',
    fontFamily: '"IBM Plex Sans", sans-serif',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.5)',
    '&.Mui-focused': {
      color: '#4aa564',
    },
  },
  '& .MuiInputAdornment-root': {
    color: 'rgba(255, 255, 255, 0.4)',
  },
})

export const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<Tle[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [parameters, setParameters] = useState<Record<string, string | number>>({ extra: 1 })
  const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Tle | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 20,
    page: 0,
  })

  // Initialize filters from URL parameters
  useEffect(() => {
    const filters = new Set<string>()
    const params: Record<string, string | number> = { extra: 1 }
    
    searchParams.forEach((value, key) => {
      // Check if it's a tag filter (boolean filters with value '1')
      if (value === '1' && (
        key.endsWith('Orbit') || 
        key.endsWith('Drag') || 
        key === 'classifiedSatellite' || 
        key === 'unclassifiedSatellite' || 
        key === 'recentTle'
      )) {
        filters.add(key)
        params[key] = 1
      }
    })
    
    setActiveTagFilters(filters)
    if (filters.size > 0) {
      setParameters((prev) => ({ ...prev, ...params }))
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const collection = useCallback(async () => {
    setLoading(true)
    const url = URL + '/api/tle'
    const searchParams = new URLSearchParams()
    Object.entries(parameters).forEach(([key, value]) => {
      searchParams.set(key, String(value))
    })

    const response = await fetch(url + '?' + searchParams.toString())
    const result = await response.json()

    setData(result.member || [])
    setTotal(result.totalItems || 0)
    setLoading(false)
  }, [parameters])

  useEffect(() => {
    collection()
  }, [collection])

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model)
    setParameters((prev) => ({
      ...prev,
      'page-size': model.pageSize,
      page: model.page + 1,
    }))
  }

  const handleSortModelChange = (sortModel: GridSortModel) => {
    if (!sortModel[0]) return

    setParameters((prev) => ({
      ...prev,
      sort: sortModel[0].field,
      'sort-dir': sortModel[0].sort || 'asc',
    }))
  }

  const handleRowSelectionModelChange = (selectionModel: GridRowSelectionModel) => {
    if (selectionModel.length > 0) {
      provider.get(selectionModel[0] as number).then((tle) => {
        setCurrent(tle)
      })
      setOpen(true)
    }
  }

  const toggleDrawer = () => {
    setOpen(!open)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim()
    if (value !== '') {
      setParameters((prev) => ({
        ...prev,
        search: value,
      }))
    }
  }


  const handleTagClick = (tagKey: string) => {
    setActiveTagFilters((prev) => {
      const newFilters = new Set(prev)
      
      if (newFilters.has(tagKey)) {
        // Remove filter
        newFilters.delete(tagKey)
        
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete(tagKey)
        setSearchParams(newSearchParams)
        
        // Update API parameters
        setParameters((prevParams) => {
          const newParams = { ...prevParams }
          delete newParams[tagKey]
          return newParams
        })
      } else {
        // Add filter
        newFilters.add(tagKey)
        
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set(tagKey, '1')
        setSearchParams(newSearchParams)
        
        // Update API parameters
        setParameters((prevParams) => ({
          ...prevParams,
          [tagKey]: 1,
        }))
      }
      
      return newFilters
    })
  }

  return (
    <PageWrapper>
      <Toolbar>
        <TextField
          label="Search satellites..."
          variant="filled"
          onChange={handleSearchChange}
          sx={getTextFieldStyles(isMobile)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </Toolbar>

      <FilterSection>
        <FilterSectionTitle>Filters</FilterSectionTitle>
        <FilterPillsContainer>
          {ORBIT_FILTERS.map((filter) => {
            const IconComponent = filter.icon
            const isActive = activeTagFilters.has(filter.key)
            return (
              <Chip
                key={filter.key}
                icon={<IconComponent style={{ fontSize: '1rem' }} />}
                label={filter.label}
                size="small"
                color={filter.color}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => handleTagClick(filter.key)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(74, 165, 100, 0.3)',
                  },
                  ...(isActive && {
                    fontWeight: 'bold',
                    boxShadow: '0 0 0 2px rgba(74, 165, 100, 0.2)',
                  }),
                }}
              />
            )
          })}
        </FilterPillsContainer>
      </FilterSection>

      <div style={{ height: isMobile ? 'calc(100vh - 300px)' : 'calc(100vh - 280px)', minHeight: 400 }}>
        <DataGrid
          rows={data}
          loading={loading}
          columns={getColumns(isMobile, activeTagFilters, handleTagClick)}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          getRowId={(row) => row.satelliteId}
          getRowHeight={() => 'auto'}
          rowCount={total}
          density={'standard'}
          onSortModelChange={handleSortModelChange}
          paginationMode={'server'}
          disableColumnMenu={false}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          sortingMode={'server'}
          sortingOrder={['desc', 'asc']}
          disableColumnSelector={true}
          pageSizeOptions={[20, 50, 100]}
          sx={getDataGridStyles(isMobile)}
        />
      </div>

      <Drawer
        variant="persistent"
        anchor={'right'}
        open={open}
        onClose={toggleDrawer}
        slotProps={{
          backdrop: { invisible: true },
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#0f1628',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            width: isMobile ? '100%' : '450px',
          },
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <IconButton onClick={toggleDrawer} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <ArrowForwardIosIcon />
            </IconButton>
          </DrawerHeader>

          <When condition={current !== null}>
            <TleBrowserWrapper>
              <TleBrowser data={current} />
            </TleBrowserWrapper>
          </When>
        </DrawerContent>
      </Drawer>
    </PageWrapper>
  )
}
