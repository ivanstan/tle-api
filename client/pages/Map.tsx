import React from 'react'
import * as satellite from 'satellite.js'
import {twoline2satrec} from 'satellite.js'
import {fromAtom, toAtom} from '../util/date'
import {GeoMap} from '../components/GeoMap'
import Marker from 'react-google-maps/lib/components/Marker'
import SatelliteMarker from '../components/icons/SatelliteMarker'
import {TleApi} from '../services/TleApi'
import {If} from 'react-if'
import Polyline from 'react-google-maps/lib/components/Polyline'
import {IconButton, InputAdornment, Toolbar} from '@material-ui/core'
import {DateTimePicker} from '@material-ui/pickers'
import {MaterialUiPickersDate} from '@material-ui/pickers/typings/date'
import AccessTimeIcon from '@material-ui/icons/AccessTime'
import {getColor} from "../services/ColorPalette"
import {AbstractPage, AbstractPagePropsInterface, AbstractPageStateInterface} from "./AbstractPage"

interface MapStateInterface extends AbstractPageStateInterface {
  satellites: any[]
}

export class Map extends AbstractPage<AbstractPagePropsInterface, Readonly<MapStateInterface>> {

  readonly state: MapStateInterface = {
    queryParams: new URLSearchParams(),
    routeParams: [],
    satellites: [],
  }

  public static getDerivedStateFromProps(props: Readonly<AbstractPagePropsInterface>, state: Readonly<MapStateInterface>): MapStateInterface {
    let newState: any = super.getDerivedStateFromProps(props, state)

    return newState
  }

  getDate = () => {
    let date: any = toAtom(new Date())

    if (this.state.queryParams.has('date') && this.state.queryParams.get('date')) {
      date = this.state.queryParams.get('date')?.replace(' ', '+')
    }

    return fromAtom(date).toJSDate()
  }

  shouldComponentUpdate(nextProps: Readonly<AbstractPagePropsInterface>, nextState: Readonly<MapStateInterface>, nextContext: any): boolean {
    let result = super.shouldComponentUpdate(nextProps, nextState, nextContext)

    if (this.state.satellites.length === 0) {
      result = true
    }

    return result
  }

  componentDidMount() {
    this.onChange()
  }

  async componentDidUpdate(prevProps: Readonly<AbstractPagePropsInterface>, prevState: Readonly<MapStateInterface>, snapshot?: any) {
    await this.onChange()
  }

  onChange = async () => {
    const {queryParams} = this.state

    // let result1 = await fetch('https://tle.ivanstanojevic.me/api/tle/25544/propagate?date=' + dateParam)
    // let response1 = await result1.json()
    //
    // {
    //   marker: {
    //       lat: response1.geodetic.latitude,
    //       lng: response1.geodetic.longitude,
    //   }
    // }

    const date = this.getDate()

    const requestParams = new URLSearchParams()

    if (queryParams.getAll('id[]').length > 0) {
      queryParams.getAll('id[]').forEach((item: any) => requestParams.append('satellite_id[]', item))

      let result2 = await fetch('https://tle.ivanstanojevic.me/api/tle?' + requestParams.toString())
      let response2 = await result2.json()

      const satellites: any = []
      response2.member?.forEach((member: any, index: number) => {
        const satrec = twoline2satrec(member.line1, member.line2)
        const positionAndVelocity = satellite.propagate(satrec, date)
        const positionEci: any = positionAndVelocity.position
        const gmst = satellite.gstime(date)

        const positionGd = satellite.eciToGeodetic(positionEci, gmst)

        satellites.push({
          color: getColor(index),
          tle: member,
          groundTracks: TleApi.groundTracks(member, date),
          marker: {
            lat: positionGd.latitude * 180 / Math.PI,
            lng: positionGd.longitude * 180 / Math.PI,
          },
        })
      })

      this.setState({satellites: satellites})
    }
  }

  handleDateChange = (event: MaterialUiPickersDate) => {
    if (event === null) {
      return
    }

    const {queryParams} = this.state

    queryParams.set('date', toAtom(event))

    super.updateUrl(null, queryParams)
  }

  render() {
    return (
      <>
        <Toolbar>
          <div style={{display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center'}}>
            <DateTimePicker
              style={{minWidth: 280}}
              label={null}
              format={'yyy-MM-dd hh:mm zzzz'}
              inputVariant='standard'
              value={this.getDate()}
              onChange={this.handleDateChange}
              showTodayButton
              size='medium'
              todayLabel='Now'
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton>
                      <AccessTimeIcon/>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

          </div>
        </Toolbar>
        <GeoMap
          zoom={2}
          containerElement={<div style={{height: window.innerHeight - (64 * 2), width: '100%'}}/>}
          mapElement={<div style={{height: `100%`}}/>}
        >
          {this.state.satellites.map((satellite: any, index: number) => (
              <React.Fragment key={index}>
                <If condition={satellite.groundTracks}>
                  <Polyline
                    path={satellite.groundTracks}
                    options={{
                      strokeColor: satellite.color,
                      strokeOpacity: 0.75,
                      strokeWeight: 2,
                    }}
                  />
                </If>
                <If condition={satellite.marker}>
                  <Marker
                    position={{lat: satellite.marker.lat, lng: satellite.marker.lng}}
                    icon={SatelliteMarker({color: satellite.color})}
                    label={satellite.tle.name}
                  />
                </If>
              </React.Fragment>
            )
          )}
        </GeoMap>
      </>
    )
  }
}
