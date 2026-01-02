import { useState, ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import { TleProvider } from '../services/TleProvider'
import styled from 'styled-components'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

interface TleSelectProps {
  value: Tle | null
  onChange: (value: Tle | null) => void
}

const provider = new TleProvider()

const StyledAutocomplete = styled(Autocomplete)`
  && {
    .MuiInputBase-root {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 16px;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(74, 165, 100, 0.4);
        background: rgba(255, 255, 255, 0.07);
      }
      
      &.Mui-focused {
        border-color: #4aa564;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(74, 165, 100, 0.15);
      }
      
      &::before, &::after {
        display: none;
      }
    }
    
    .MuiInputBase-input {
      color: #ffffff;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 1rem;
      padding: 12px 8px;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
        opacity: 1;
      }
    }
    
    .MuiInputLabel-root {
      color: rgba(255, 255, 255, 0.5);
      font-family: 'IBM Plex Sans', sans-serif;
      
      &.Mui-focused {
        color: #4aa564;
      }
    }
    
    .MuiSvgIcon-root {
      color: rgba(255, 255, 255, 0.5);
    }
    
    .MuiAutocomplete-endAdornment {
      .MuiSvgIcon-root {
        color: rgba(255, 255, 255, 0.4);
        
        &:hover {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
  }
` as typeof Autocomplete

const SearchIconStyled = styled(SearchIcon)`
  && {
    color: rgba(255, 255, 255, 0.4);
    margin-right: 4px;
  }
`

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

  const width = window.innerWidth < 500 ? '100%' : 420

  return (
    <StyledAutocomplete
      value={value}
      onChange={(_event, newValue) => {
        onChange(newValue as Tle | null)
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
      isOptionEqualToValue={(option, val) => (option as Tle).name === (val as Tle).name}
      getOptionLabel={(option) => (option as Tle).name || '-'}
      options={options}
      loading={loading}
      noOptionsText={'No satellites found'}
      renderOption={(props, option) => {
        const tle = option as Tle
        return (
          <li {...props} key={tle.satelliteId}>
            {tle.name}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setInputValue(event.target.value)
            setLoading(true)
            query(event.target.value)
          }}
          placeholder="Search satellites by name or ID..."
          variant="standard"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIconStyled />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="primary" size={20} />
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
