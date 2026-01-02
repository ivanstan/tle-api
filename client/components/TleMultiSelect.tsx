import { useState, ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import { Checkbox, Chip } from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { If } from 'react-if'
import { TleProvider } from '../services/TleProvider'

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

interface TleMultiSelectProps {
  value: Tle[] | null
  onChange: (value: Tle[]) => void
}

const provider = new TleProvider()

export const TleMultiSelect = ({ value, onChange }: TleMultiSelectProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<Tle[]>([])
  const [inputValue, setInputValue] = useState('')

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
      size="small"
      multiple
      value={value || []}
      disableCloseOnSelect
      renderOption={(props, option, { selected }) => {
        const { key, ...restProps } = props
        return (
          <li key={key} {...restProps}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.name}
          </li>
        )
      }}
      onChange={(_event, newValue) => {
        onChange(newValue)
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
      renderTags={(tagValue, getTagProps) => {
        const newValue = [...tagValue]
        const render = newValue.slice(0, 2)
        const left = newValue.splice(2, tagValue.length)

        return (
          <>
            {render.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return <Chip key={key} label={option.name} {...tagProps} />
            })}
            <If condition={tagValue.length >= 2 && left.length > 0}>
              <Chip label={'+' + left.length} />
            </If>
          </>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          value={inputValue}
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
