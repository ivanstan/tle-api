import React from "react"
import styled from "styled-components"
import { Line } from "react-chartjs-2"

const Badge = styled.img`
  margin-right: 5px
`

const options = {
  maintainAspectRatio: false,
  title: {
    display: true,
    text: 'Number of requests in last three days'
  },
  legend: {
    display: false,
  },
}

export class Health extends React.Component<any, any> {

  public readonly state: any = { data: [], labels: [] }

  componentDidMount() {
    this.getData().then(response => {

      const labels: any[] = []
      Object.keys(response).forEach(item => {
        let dateObject: Date = new Date(Date.parse(item))

        labels.push(dateObject.toLocaleString())
      })

      this.setState({
        data: Object.values(response),
        labels: labels
      })
    })
  }

  getData = async () => {
    const response = await fetch('https://tle.ivanstanojevic.me/api/tle/hits')
    return await response.json()
  }

  render() {
    let data = {
      labels: this.state.labels,
      datasets: [{
        label: 'Requests',
        data: this.state.data,
        borderWidth: 1,
        borderColor: 'rgba(53, 134, 77, 1)',
        backgroundColor: 'rgba(53, 134, 77, 0.2)',
      }]
    }

    return (
      <div className="container">
        <div className="row bg-white py-4">
          <div className="col-12 mb-4 px-4">
            <h1 className="mb-4">API Health</h1>
            <div className="mb-4">
              <Badge src="https://badgen.net/uptime-robot/status/m781499721-d42767e28cc71aea507fb087"
                     alt="API status"/>
              <Badge src="https://badgen.net/uptime-robot/week/m781499721-d42767e28cc71aea507fb087"
                     alt="API uptime"/>
              <Badge src="https://badgen.net/uptime-robot/response/m781499721-d42767e28cc71aea507fb087"
                     alt="API response"/>
            </div>
          </div>

          <div className="col-12 py-4">
            <Line
              data={data}
              height={400}
              options={options}
            />
          </div>
        </div>
      </div>
    )
  }
}
