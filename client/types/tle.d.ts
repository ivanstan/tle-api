interface Tle {
  satelliteId: number
  name: string
  date: string
  line1: string
  line2: string
  extra?: {
    inclination?: number
    eccentricity?: number
    semi_major_axis?: number
    period?: number
    raan?: number
  }
}






