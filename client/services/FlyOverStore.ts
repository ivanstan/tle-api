import { makeObservable, observable } from "mobx"
import { promisedComputed } from "computed-async-mobx"
import TleApi from "../services/TleApi"
import Observer from "./Observer"

export class FlyOverStore {

  constructor() {
    makeObservable(this)
  }

  @observable
  public tle: any

  public flyovers = promisedComputed({}, async () => {
    return await TleApi.flyOver(this.tle, Observer.position)
  })

}

export default new FlyOverStore()
