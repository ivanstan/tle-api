import React from "react"

export class TleElementDetails extends React.Component<any, any> {

  render() {
    const { title, color } = this.props

    let squareStyle: any = {
      width: 16,
      height: 16,
      backgroundColor: color,
      marginRight: 10,
    }

    return (
      <>
        <div className="element-detail">
          <div className="d-flex align-items-center">
            <div style={squareStyle}/>
            <span className="element-title">{title}</span>
          </div>
        </div>
      </>
    )
  }

}
