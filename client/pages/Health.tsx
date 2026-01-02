import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Badge = styled.img`
  margin-right: 5px;
`

const options = {
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Number of requests in last three days',
    },
    legend: {
      display: false,
    },
  },
}

export const Health = () => {
  const [chartData, setChartData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    const getData = async () => {
      const response = await fetch(
        'https://tle.ivanstanojevic.me/api/tle/hits'
      )
      return await response.json()
    }

    getData().then((response) => {
      const newLabels: string[] = []
      Object.keys(response).forEach((item) => {
        const dateObject = new Date(Date.parse(item))
        newLabels.push(dateObject.toLocaleString())
      })

      setChartData(Object.values(response))
      setLabels(newLabels)
    })
  }, [])

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Requests',
        data: chartData,
        borderWidth: 1,
        borderColor: 'rgba(53, 134, 77, 1)',
        backgroundColor: 'rgba(53, 134, 77, 0.2)',
        fill: true,
      },
    ],
  }

  return (
    <div className="container">
      <div className="row bg-white py-4">
        <div className="col-12 mb-4 px-4">
          <h1 className="mb-4">API Health</h1>
          <div className="mb-4">
            <Badge
              src="https://badgen.net/uptime-robot/status/m781499721-d42767e28cc71aea507fb087"
              alt="API status"
            />
            <Badge
              src="https://badgen.net/uptime-robot/week/m781499721-d42767e28cc71aea507fb087"
              alt="API uptime"
            />
            <Badge
              src="https://badgen.net/uptime-robot/response/m781499721-d42767e28cc71aea507fb087"
              alt="API response"
            />
          </div>
        </div>

        <div className="col-12 py-4">
          <div style={{ height: 400 }}>
            <Line data={data} options={options} />
          </div>
        </div>
      </div>
    </div>
  )
}
