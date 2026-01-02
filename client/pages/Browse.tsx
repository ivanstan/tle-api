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

const Toolbar = styled.div`
  padding: 10px 0;
`

const DrawerHeader = styled.div`
  padding: 20px;
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
    <div style={{ height: 'calc(100% - 144px)', padding: 5 }}>
      <Toolbar>
        <TextField
          label="Search..."
          variant="filled"
          onChange={handleSearchChange}
          style={{ width: 245 }}
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
          style={{ width: 245, marginLeft: 10 }}
          variant="filled"
          onChange={handleInclinationFilter}
          value={orbitValue}
        >
          <MenuItem value={'-'}>-</MenuItem>
          <MenuItem value={RETROGRADE}>Retrograde</MenuItem>
          <MenuItem value={POSIGRADE}>Posigrade</MenuItem>
        </Select>
      </Toolbar>

      <DataGrid
        rows={data}
        loading={loading}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        getRowId={(row) => row.satelliteId}
        rowHeight={52}
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
      />

      <Drawer
        variant="persistent"
        anchor={'right'}
        open={open}
        onClose={toggleDrawer}
        slotProps={{
          backdrop: { invisible: true },
        }}
      >
        <DrawerHeader>
          <IconButton onClick={toggleDrawer}>
            <ArrowForwardIosIcon />
          </IconButton>
        </DrawerHeader>

        <If condition={current !== null}>
          <TleBrowserWrapper>
            <TleBrowser data={current} />
          </TleBrowserWrapper>
        </If>
      </Drawer>
    </div>
  )
}
