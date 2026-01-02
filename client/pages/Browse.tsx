import { useState, useEffect, useCallback } from 'react'
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridRowSelectionModel } from '@mui/x-data-grid'
import {
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  SelectChangeEvent,
} from '@mui/material'
import { If } from 'react-if'
import { TleBrowser } from '../components/TleBrowser'
import styled from 'styled-components'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import SearchIcon from '@mui/icons-material/Search'
import { TleProvider } from '../services/TleProvider'

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
  padding: 20px;
`

const Toolbar = styled.div`
  padding: 10px 0 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const DrawerContent = styled.div`
  background: #0f1628;
  height: 100%;
`

const DrawerHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`

export const RETROGRADE = 'retrograde'
export const POSIGRADE = 'posigrade'

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':')
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    type: 'string',
    width: 250,
    disableColumnMenu: true,
  },
  {
    field: 'inclination',
    headerName: 'Inclination',
    width: 250,
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
    width: 250,
    valueGetter: (_value, row) => {
      return row.extra?.eccentricity ?? '-'
    },
    disableColumnMenu: true,
    sortable: true,
  },
  {
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
  },
]

const TleBrowserWrapper = styled.div`
  padding: 20px;
`

const URL = 'https://tle.ivanstanojevic.me'

const provider = new TleProvider()

// DataGrid dark theme with zebra rows
const dataGridStyles = {
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  '& .MuiDataGrid-columnHeaderTitle': {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    fontFamily: '"IBM Plex Sans", sans-serif',
    color: 'rgba(255, 255, 255, 0.85)',
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
  },
  
  '& .MuiTablePagination-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  '& .MuiTablePagination-selectIcon': {
    color: 'rgba(255, 255, 255, 0.5)',
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
}

// TextField styles for dark theme
const textFieldStyles = {
  width: 260,
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
}

// Select styles for dark theme
const selectStyles = {
  width: 200,
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&:before, &:after': {
      display: 'none',
    },
  },
  '& .MuiSelect-select': {
    color: '#ffffff',
    fontFamily: '"IBM Plex Sans", sans-serif',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
}

export const Browse = () => {
  const [data, setData] = useState<Tle[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [parameters, setParameters] = useState<Record<string, string | number>>({ extra: 1 })
  const [orbitValue, setOrbitValue] = useState('-')
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Tle | null>(null)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 20,
    page: 0,
  })

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

  const handleInclinationFilter = (event: SelectChangeEvent) => {
    const value = event.target.value

    setParameters((prev) => {
      const newParams = { ...prev }

      if (value === RETROGRADE) {
        newParams['inclination[gt]'] = 90
        delete newParams['inclination[lt]']
      } else if (value === POSIGRADE) {
        newParams['inclination[lt]'] = 90
        delete newParams['inclination[gt]']
      } else {
        delete newParams['inclination[lt]']
        delete newParams['inclination[gt]']
      }

      return newParams
    })

    setOrbitValue(value)
  }

  return (
    <PageWrapper>
      <Toolbar>
        <TextField
          label="Search satellites..."
          variant="filled"
          onChange={handleSearchChange}
          sx={textFieldStyles}
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

        <Select
          variant="filled"
          onChange={handleInclinationFilter}
          value={orbitValue}
          sx={selectStyles}
        >
          <MenuItem value={'-'}>All orbits</MenuItem>
          <MenuItem value={RETROGRADE}>Retrograde</MenuItem>
          <MenuItem value={POSIGRADE}>Posigrade</MenuItem>
        </Select>
      </Toolbar>

      <div style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
        <DataGrid
          rows={data}
          loading={loading}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          getRowId={(row) => row.satelliteId}
          rowHeight={48}
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
          sx={dataGridStyles}
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
          },
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <IconButton onClick={toggleDrawer} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <ArrowForwardIosIcon />
            </IconButton>
          </DrawerHeader>

          <If condition={current !== null}>
            <TleBrowserWrapper>
              <TleBrowser data={current} />
            </TleBrowserWrapper>
          </If>
        </DrawerContent>
      </Drawer>
    </PageWrapper>
  )
}
