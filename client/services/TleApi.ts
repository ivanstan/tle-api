import { toAtom } from "../util/date"
import { Tle } from "tle-client"
import * as satellite from "satellite.js"
import { TleParser } from "./TleParser"
import { LatLng } from "../model/LatLng"

export class TleApi {

  static GROUND_TRACK_ORBITS = 1

  predict = async (satelliteId: number, date: Date) => {
    let atom = toAtom(date)

    let result: any = await fetch(`https://tle.ivanstanojevic.me/api/tle/${satelliteId}/propagate?date=${atom}`)
    result = await result.json()

    result['groundTracks'] = TleApi.groundTracks(result.tle, date)

    return result
  }

  static groundTracks(tle: Tle, date: Date) {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2)

    const period = (new TleParser(tle)).getPeriod()

    let dt = 30, // time increase [seconds]
      TO = Math.floor(period),
      timestamp = Math.floor(date.getTime() / 1000),
      half = Math.floor(TO / 2 * TleApi.GROUND_TRACK_ORBITS),
      T1 = timestamp - half, // start time
      T2 = timestamp + half, // end time
      result: any[] = []

    while (T1 < T2) {
      let time: Date = new Date(T1 * 1000)

      const positionAndVelocity: any = satellite.propagate(satrec, time)

      const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, satellite.gstime(date))

      result.push({
        lat: geodetic.latitude * 180 / Math.PI,
        lng: geodetic.longitude * 180 / Math.PI,
      })

      T1 += dt
    }

    return result
  }

  flyOver = async (tle: Tle | number, position: LatLng) => {
    let id = tle
    if (typeof tle === "object") {
      id = tle.satelliteId
    }

    const params = new URLSearchParams()
    params.append('latitude', position.latitude.toString())
    params.append('longitude', position.longitude.toString())

    let result: any = await fetch(`https://tle.ivanstanojevic.me/api/tle/${id}/flyover?${params.toString()}`)

    return await result.json()
  }

}

export default new TleApi()
