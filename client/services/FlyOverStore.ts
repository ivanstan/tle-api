import { makeAutoObservable } from "mobx";
import { promisedComputed } from "computed-async-mobx";
import TleApi from "../services/TleApi";
import Observer from "./Observer";

export class FlyOverStore {
  tle: any;

  flyovers = promisedComputed({}, async () => {
    return await TleApi.flyOver(this.tle, Observer.position);
  });

  constructor() {
    makeAutoObservable(this); // Use makeAutoObservable instead of makeObservable
  }
}

export default new FlyOverStore();
