import React from "react"
import { styles } from "../util/map"
import { GoogleMap, withGoogleMap } from "react-google-maps"
import Marker from "react-google-maps/lib/components/Marker"
import { If } from "react-if"
import { Observer } from "../services/Observer"
import { inject } from "mobx-react"
import ObserverIcon from "./icons/ObserverIcon"

interface GeoMapPropsInterface {
  zoom?: number
  renderObserver?: boolean
  observer?: Observer
}

interface GeoMapStateInterface {

}

@inject('observer')
class CustomGoogleMap extends React.Component<GeoMapPropsInterface, GeoMapStateInterface> {

  private _map: any

  onObserverDragEnd = (event: any): void => {
    const { observer } = this.props

    if (observer) {
      observer.setPosition({
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      })
    }
  }

  onClick = (event: any): void => {
    let { renderObserver } = this.props

    if (renderObserver) {
      this.onObserverDragEnd(event);
    }
  };

  render() {
    let { zoom, renderObserver, observer } = this.props

    if (!observer) {
      return null
    }

    // @ts-ignore
    return (
      <GoogleMap
        ref={(map) => this._map = map}
        defaultCenter={{ lat: -10, lng: 8 }}
        defaultZoom={zoom || 1}
        onClick={this.onClick}
        defaultOptions={{
          styles: styles,
          streetViewControl: false,
          mapTypeControl: false,
          scrollwheel: false,
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180
            }
          },
        }}
      >
        {this.props.children}
        <If condition={renderObserver && observer !== undefined}>
          <Marker
            position={{ lat: observer.position.latitude, lng: observer.position.longitude }}
            draggable={true}
            onDragEnd={this.onObserverDragEnd}
            icon={ObserverIcon}
          />
        </If>
      </GoogleMap>
    )
  }
}

export const GeoMap = withGoogleMap(CustomGoogleMap)
