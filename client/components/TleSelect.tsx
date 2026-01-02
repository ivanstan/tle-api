import { useState, ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import { TleProvider } from '../services/TleProvider'

interface TleSelectProps {
  value: Tle | null
  onChange: (value: Tle | null) => void
}

const provider = new TleProvider()

export const TleSelect = ({ value, onChange }: TleSelectProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<Tle[]>([])
  const [inputValue, setInputValue] = useState(value?.name || '')

  const query = async (searchValue: string = '') => {
    try {
      const data = await provider.search(searchValue)
      setOptions(data)
      setLoading(false)
    } catch {
      setOptions([])
      setLoading(false)
    }
  }

  const width = window.innerWidth < 500 ? 'auto' : 400

  return (
    <Autocomplete
      value={value}
      onChange={(_event, newValue) => {
        onChange(newValue)
      }}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      sx={{ width, margin: 'auto' }}
      open={open}
      onOpen={() => {
        if (options.length === 0) {
          query()
        }
        setOpen(true)
      }}
      onClose={() => {
        setOpen(false)
      }}
      isOptionEqualToValue={(option, val) => option.name === val.name}
      getOptionLabel={(option) => option.name || '-'}
      options={options}
      loading={loading}
      noOptionsText={'No results found'}
      renderInput={(params) => (
        <TextField
          {...params}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setInputValue(event.target.value)
            setLoading(true)
            query(event.target.value)
          }}
          label="Search satellites"
          variant="standard"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
