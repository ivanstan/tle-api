import { LatLng } from "../model/LatLng"
import { action, makeObservable, observable } from "mobx"

export class Observer {

  @observable
  public position: LatLng

  @action
  setPosition = (position: LatLng) => {
    this.position = position

    this.persist()
  }

  constructor() {
    this.position = {
      latitude: 0,
      longitude: 0
    }

    this.restore().then(data => {
      this.position = data.position
    })

    makeObservable(this)
  }

  protected getHtml5Geolocation = (defaultValue: LatLng): Promise<LatLng> => {
    if (!navigator.geolocation) {
      return new Promise(resolve => resolve(defaultValue))
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition((position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      }), () => {
        resolve(defaultValue)
      })
    })
  }

  protected restore = async (): Promise<any> => {
    let json = localStorage.getItem('observer') || '{}'

    let data
    try {
      data = JSON.parse(json)
    } catch (e) {
      data = {}
    }

    let result = {
      position: this.position
    }

    if (data.hasOwnProperty('position')) {
      result.position = data.position
    } else {
      result.position = await this.getHtml5Geolocation(this.position)
    }

    return result
  }

  protected persist = (): void => {
    const data = {
      position: this.position,
    }

    localStorage.setItem('observer', JSON.stringify(data))
  }
}

export default new Observer()
