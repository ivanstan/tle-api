import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
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

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
  padding: 60px 20px;
`

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
  animation: ${fadeInUp} 0.6s ease-out;
`

const PageTitle = styled.h1`
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px;
  
  span {
    color: #4aa564;
  }
`

const PageSubtitle = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
`

const BadgeSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 48px;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
`

const Badge = styled.img`
  height: 28px;
  border-radius: 6px;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`

const ChartSection = styled.div`
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
`

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(10px);
`

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`

const ChartTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  
  &::before {
    content: '//';
    color: #4aa564;
    margin-right: 8px;
    opacity: 0.7;
  }
`

const ChartLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`

const LegendDot = styled.span`
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #4aa564 0%, #74bd8c 100%);
  border-radius: 3px;
`

const ChartWrapper = styled.div`
  height: 400px;
  position: relative;

  @media (max-width: 768px) {
    height: 300px;
  }
`

const LoadingState = styled.div`
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'IBM Plex Sans', sans-serif;
`

const ErrorState = styled.div`
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'IBM Plex Sans', sans-serif;
  text-align: center;
  gap: 12px;
`

// Chart.js options for dark theme
const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(15, 22, 40, 0.95)',
      titleColor: '#ffffff',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: {
        family: 'IBM Plex Sans',
        size: 13,
        weight: 600,
      },
      bodyFont: {
        family: 'IBM Plex Sans',
        size: 12,
      },
      displayColors: false,
      callbacks: {
        label: function(context: any) {
          return `${context.parsed.y.toLocaleString()} requests`;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          family: 'IBM Plex Sans',
          size: 11,
        },
        maxRotation: 45,
        minRotation: 45,
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          family: 'JetBrains Mono',
          size: 11,
        },
        callback: function(value: any) {
          return value.toLocaleString();
        }
      },
      beginAtZero: false,
    },
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: '#4aa564',
      borderColor: '#0a0e1a',
      borderWidth: 2,
    },
    line: {
      tension: 0.4,
    },
  },
}

export const Health = () => {
  const [chartData, setChartData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(
          'https://tle.ivanstanojevic.me/api/tle/hits'
        )
        if (!response.ok) throw new Error('Failed to fetch')
        return await response.json()
      } catch (err) {
        setError(true)
        setLoading(false)
        throw err
      }
    }

    getData().then((response) => {
      const newLabels: string[] = []
      Object.keys(response).forEach((item) => {
        const dateObject = new Date(Date.parse(item))
        newLabels.push(dateObject.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
      })

      setChartData(Object.values(response))
      setLabels(newLabels)
      setLoading(false)
    }).catch(() => {
      // Error already handled
    })
  }, [])

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Requests',
        data: chartData,
        borderWidth: 2,
        borderColor: '#4aa564',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(74, 165, 100, 0.3)');
          gradient.addColorStop(0.5, 'rgba(74, 165, 100, 0.1)');
          gradient.addColorStop(1, 'rgba(74, 165, 100, 0)');
          return gradient;
        },
        fill: true,
        pointBackgroundColor: '#4aa564',
        pointBorderColor: '#0a0e1a',
        pointBorderWidth: 2,
      },
    ],
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <PageTitle>
            <span>API</span> Health
          </PageTitle>
          <PageSubtitle>
            Real-time status and performance metrics
          </PageSubtitle>
        </Header>

        <BadgeSection>
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
        </BadgeSection>

        <ChartSection>
          <ChartCard>
            <ChartHeader>
              <ChartTitle>Request Volume</ChartTitle>
              <ChartLegend>
                <LegendDot />
                <span>Requests per hour (last 3 days)</span>
              </ChartLegend>
            </ChartHeader>

            <ChartWrapper>
              {loading ? (
                <LoadingState>Loading chart data...</LoadingState>
              ) : error ? (
                <ErrorState>
                  <span style={{ fontSize: '2rem' }}>📊</span>
                  <span>Unable to load chart data</span>
                </ErrorState>
              ) : (
                <Line data={data} options={chartOptions} />
              )}
            </ChartWrapper>
          </ChartCard>
        </ChartSection>
      </Container>
    </PageWrapper>
  )
}
