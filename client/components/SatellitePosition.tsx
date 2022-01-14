import React from "react"
import { GeoMap } from "./GeoMap"
import Marker from "react-google-maps/lib/components/Marker"
import { If } from "react-if"
import Polyline from "react-google-maps/lib/components/Polyline"
import SatelliteMarker from "./icons/SatelliteMarker";

export class SatellitePosition extends React.Component<any, any> {

  readonly state: any = {
    satelliteId: null,
    propagation: null
  }

  shouldComponentUpdate(nextProps: Readonly<any>, nextState: Readonly<any>, nextContext: any): boolean {
    return this.state.satelliteId !== nextProps.satelliteId
  }

  static getDerivedStateFromProps(props: any) {
    return {
      propagation: props.propagation,
      satelliteId: props.satelliteId,
    }
  }

  render() {
    const { propagation } = this.state

    return <>
      <GeoMap
        containerElement={<div className="mt-3" style={{ height: 510, width: '100%' }}/>}
        mapElement={<div style={{ height: `100%` }}/>}
      >
        <If condition={propagation}>
          <Marker position={{ lat: propagation.geodetic.latitude, lng: propagation.geodetic.longitude }} icon={SatelliteMarker({color: '#5BA473'})}/>
        </If>

        <If condition={propagation.groundTracks}>
          <Polyline
            path={propagation.groundTracks}
            // geodesic={true}
            options={{
              strokeColor: "#74BD8C",
              strokeOpacity: 0.75,
              strokeWeight: 2,
            }}
          />
        </If>
      </GeoMap>
      <If condition={propagation}>
        <span style={{ fontSize: 12 }}>
          {propagation.tle.name} position on {propagation.parameters.date}
        </span>
      </If>
    </>
  }
}
