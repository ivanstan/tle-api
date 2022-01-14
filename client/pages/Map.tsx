import React from 'react';
import * as satellite from 'satellite.js';
import { twoline2satrec } from 'satellite.js';
import { fromAtom, toAtom } from '../util/date';
import { GeoMap } from '../components/GeoMap';
import Marker from 'react-google-maps/lib/components/Marker';
import { RouteComponentProps } from 'react-router';
import SatelliteMarker from '../components/icons/SatelliteMarker';
import { TleApi } from '../services/TleApi';
import { If } from 'react-if';
import Polyline from 'react-google-maps/lib/components/Polyline';
import { IconButton, InputAdornment, Toolbar } from '@material-ui/core';
import { DateTimePicker } from '@material-ui/pickers';
import { DateTime } from 'luxon';
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import { getColor } from "../services/ColorPalette";

interface MapPropsInterface extends RouteComponentProps {

}

interface MapStateInterface {
  satellites: any[]
  data: any[]
  date: Date
  params: any
}

export class Map extends React.Component<MapPropsInterface, MapStateInterface> {

  state = {
    date: DateTime.now().toJSDate(),
    params: new URLSearchParams(),
    satellites: [],
    data: [],
  }

  public static getDerivedStateFromProps(props: Readonly<MapPropsInterface>, state: Readonly<MapStateInterface>) {
    const params = new URLSearchParams(props.location.search);

    let date: any = toAtom(new Date());
    let dateFromParam = params.get('date');

    if (dateFromParam) {
      date = dateFromParam.replace(' ', '+');
    }

    return {
      date: fromAtom(date).toJSDate(),
      params: params,
    };
  }

  shouldComponentUpdate(nextProps: Readonly<MapPropsInterface>, nextState: Readonly<MapStateInterface>, nextContext: any): boolean {
    if (nextProps.location.search !== this.props.location.search) {
      return true;
    }

    if (this.state.satellites.length === 0) {
      return true;
    }

    return false;
  }

  componentDidMount() {
    this.componentDidUpdate(this.props, this.state);
  }

  async componentDidUpdate(prevProps: Readonly<MapPropsInterface>, prevState: Readonly<MapStateInterface>, snapshot?: any) {
    const { params } = this.state

    // let result1 = await fetch('https://tle.ivanstanojevic.me/api/tle/25544/propagate?date=' + dateParam)
    // let response1 = await result1.json()
    //
    // {
    //   marker: {
    //     lat: response1.geodetic.latitude,
    //       lng: response1.geodetic.longitude,
    //   }
    // }

    const date = this.state.date;

    const requestParams = new URLSearchParams();

    if (params.getAll('id[]').length > 0) {
      params.getAll('id[]').forEach(item => requestParams.append('satellite_id[]', item));

      let result2 = await fetch('https://tle.ivanstanojevic.me/api/tle?' + requestParams.toString());
      let response2 = await result2.json();

      const satellites: any = [];
      response2.member.forEach((member: any, index: number) => {
        const satrec = twoline2satrec(member.line1, member.line2);
        const positionAndVelocity = satellite.propagate(satrec, date);
        const positionEci: any = positionAndVelocity.position;
        const gmst = satellite.gstime(date);

        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        satellites.push({
          color: getColor(index),
          tle: member,
          groundTracks: TleApi.groundTracks(member, date),
          marker: {
            lat: positionGd.latitude * 180 / Math.PI,
            lng: positionGd.longitude * 180 / Math.PI,
          },
        });
      });

      this.setState({ satellites: satellites });
    }
  }

  handleDateChange = (event: MaterialUiPickersDate) => {
    if (event === null) {
      return;
    }

    const { params } = this.state;

    params.set('date', toAtom(event));

    this.updateUrl(params);
  };

  updateUrl = (params: URLSearchParams) => {
    const { history } = this.props;

    history.push({
      pathname: history.location.pathname,
      search: decodeURIComponent(params.toString()),
    });
  };

  onChange = (satellites: any | null) => {
    const { params } = this.state;

    const objectParams: any = {};
    params.forEach((item, index) => objectParams[index] = item)
    console.log(objectParams)

    params.delete('id[]');

    satellites.forEach((satellite: any) => params.append('id[]', satellite.satelliteId))

    this.updateUrl(params);
  }

  render() {
    const { satellites, params, data } = this.state;

    const labelSize = { width: 220};
    const labelPadding = 8;

    return (
      <>
        <Toolbar>
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center' }}>

            {/*<TleMultiSelect*/}
            {/*  onChange={this.onChange}*/}
            {/*  value={satellites.map((satellite: any) => satellite.tle)}*/}
            {/*/>*/}

            <div style={{ flexGrow: 1 }}/>

            <DateTimePicker
              style={{ minWidth: 280 }}
              label={null}
              format={'yyy-MM-dd hh:mm zzzz'}
              inputVariant='standard'
              value={this.state.date}
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
          containerElement={<div style={{ height: window.innerHeight - (64 * 2), width: '100%' }}/>}
          mapElement={<div style={{ height: `100%` }}/>}
        >
          {satellites.map((satellite: any, index: number) => (
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
                  position={{ lat: satellite.marker.lat, lng: satellite.marker.lng }}
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

