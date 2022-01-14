export interface SatelliteMarkerIconOptionsInterface {
  color: string
}

export default (options: SatelliteMarkerIconOptionsInterface) => {
  const { color } = options

  return {
    path: "M28.2 28.3L16.5 40l8.5 8.5 8.5 8.5 12.2-12.3L58 32.5l-8-8c-4.4-4.4-8.4-8-9-8-.6 0-6.3 5.3-12.8 11.8zM51.7 50.8L39.5 63l8.3 8.3 8.2 8.2 12.3-12.3L80.5 55l-8.3-8.3-8.2-8.2-12.3 12.3zM74 73.5l-12 12 8.5 8.5 8.5 8.5 11.7-11.7c6.5-6.5 11.8-12.2 11.8-12.8 0-1-15.1-16.5-16-16.5-.3 0-5.9 5.4-12.5 12zM118 76.4c-1.6 1-11.8 10.7-22.5 21.5L76 117.5v12l9.8 9.7 9.7 9.8h12l20.9-21c13.4-13.4 21.2-22 21.6-23.8 1.5-6-.3-9.7-8.8-18.5-10.9-11.3-16.5-13.5-23.2-9.3zM134.2 134.3L122.5 146l8.5 8.5 8.5 8.5 12.2-12.3 12.3-12.2-8-8c-4.4-4.4-8.4-8-9-8s-6.3 5.3-12.8 11.8zM55.7 136.3c-2.9 1.1-5.9 2.5-6.5 3.1-.9.9 3.3 5.6 17.1 19.4 17.5 17.4 18.4 18.1 19.8 16.2 4.4-5.9 5.3-17.8 1.8-24.8-6.2-12.3-20-18.2-32.2-13.9zM157.7 156.8L145.5 169l8.3 8.3 8.2 8.2 12.3-12.3 12.2-12.2-8.3-8.3-8.2-8.2-12.3 12.3zM180 179.5l-12 12 8.5 8.5 8.5 8.5 11.7-11.7c6.5-6.5 11.8-12.2 11.8-12.8 0-1-15.1-16.5-16-16.5-.3 0-5.9 5.4-12.5 12z",
    strokeColor: color,
    fillColor: color,
    fillOpacity: 1.0,
    scale: 0.2,
    anchor: new google.maps.Point(100, 130)
  }
}
