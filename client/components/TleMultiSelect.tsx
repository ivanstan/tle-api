import React, { ChangeEvent } from "react"
import TextField from "@material-ui/core/TextField"
import CircularProgress from "@material-ui/core/CircularProgress"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { Checkbox, Chip } from "@material-ui/core";
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { If } from "react-if";
import { Tle, TleProvider } from "tle-client/index";

const icon = <CheckBoxOutlineBlankIcon fontSize="small"/>;
const checkedIcon = <CheckBoxIcon fontSize="small"/>;

export interface TleSelectPropsInterface {
  value: Tle[] | null
  onChange: Function
}

export class TleMultiSelect extends React.Component<any, any> {

  private provider: TleProvider

  public readonly state = {
    open: false,
    loading: false,
    options: [],
    value: null,
    inputValue: null,
  }

  constructor(props: any) {
    super(props)

    this.state.value = props.value
    this.state.inputValue = props.value?.name

    this.provider = new TleProvider()
  }

  static getDerivedStateFromProps(props: TleSelectPropsInterface, state: any) {

    if (props.value === null) {
      return null
    }

    return {
      value: props.value,
    }
  }

  public async query(inputValue: string = '') {
    this.provider.search(inputValue)
      .then((data: Tle[]) => {
        this.setState({ options: data, loading: false })
      })
      .catch(() => this.setState({ options: [], loading: false }))
  }

  render() {
    const { open, options, value, inputValue, loading } = this.state
    const { onChange } = this.props

    let width = (window.innerWidth < 500) ? 'auto' : 400

    // @ts-ignore
    return (
      <Autocomplete
        size='small'
        multiple
        value={value || undefined}
        disableCloseOnSelect
        renderOption={(option, { selected }) => (
          <React.Fragment>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.name}
          </React.Fragment>
        )}
        onChange={(event, newValue: any) => {
          this.setState({ value: newValue })

          if (onChange !== null && typeof onChange === 'function') {
            onChange(newValue)
          }
        }}
        style={{ width: width, margin: 'auto' }}
        open={open}
        onOpen={() => {
          if (options.length === 0) {
            this.query()
          }
          this.setState({ open: true })
        }}
        onClose={() => {
          this.setState({ open: false })
        }}
        getOptionSelected={(option: any, value) => option.name === value.name}
        getOptionLabel={(option: any) => option.name || '-'}
        options={options}
        loading={loading}
        noOptionsText={"No results found"}
        renderTags={(value, getTagProps) => {
          const newValue = [...value];

          let render = newValue.slice(0, 2);
          let left = newValue.splice(2, value.length)

          return <>
            {render.map((option, index) => (
              <Chip
                label={option.name}
                {...getTagProps({ index })}
              />
            ))}
            <If condition={value.length >= 2 && left.length > 0}>
              <Chip
                label={'+' + left.length}
              />
            </If>
          </>
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            value={inputValue}
            onChange={(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              this.setState({ inputValue: event.target.value, loading: true }, () => this.query(event.target.value))
            }}
            label="Search satellites"
            variant="standard"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20}/> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
    );
  }
}
