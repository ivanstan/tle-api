import React from "react"
import { Tle } from "tle-client"
import { CopyButton } from "./CopyButton"

interface TleDisplayPropsInterface {
  data: Tle
}

export class TleDisplay extends React.Component<TleDisplayPropsInterface, any> {

  render() {
    const { data } = this.props

    return (
      <div className="code tle-display d-flex justify-content-between">
        <div>
          <div className="name">
            <span className={'element'}>{data.name}</span>
          </div>
          <div>{data.line1}</div>
          <div>{data.line2}</div>
        </div>
        <div className="align-self-center">
          <CopyButton value={data.line1 + "\n" + data.line2}/>
        </div>
      </div>
    )
  }
}
