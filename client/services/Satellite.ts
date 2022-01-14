import * as satellite from 'satellite.js'
import { Tle } from "tle-client"
import { toAtom } from "../util/date"
import { TleApi } from "./TleApi"

export class Satellite {

  public sgp4 = (tle: Tle, date: Date) => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2)

    const positionAndVelocity = satellite.propagate(satrec, date)

    const positionEci: any = positionAndVelocity.position
    const gmst = satellite.gstime(date)

    const positionGd = satellite.eciToGeodetic(positionEci, gmst)

    return {
      tle: tle,
      parameters: {
        satelliteId: tle.satelliteId,
        date: toAtom(date)
      },
      groundTracks: TleApi.groundTracks(tle, date),
      geodetic: {
        latitude: positionGd.latitude * 180 / Math.PI,
        longitude: positionGd.longitude * 180 / Math.PI,
      }
    }
  }



}

export default new Satellite()
