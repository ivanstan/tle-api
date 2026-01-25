import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TleSelect } from '../components/TleSelect'
import { TleBrowser } from '../components/TleBrowser'
import { TlePopularProvider } from '../services/TlePopularProvider'
import styled, { keyframes } from 'styled-components'
import { TleProvider } from '../services/TleProvider'

const orbitPath = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`

const twinkle = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
  position: relative;
  overflow: hidden;
`

const StarField = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`

const Star = styled.div<{ $size: number; $top: number; $left: number; $delay: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: #ffffff;
  border-radius: 50%;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  animation: ${twinkle} ${props => 2 + props.$delay}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  box-shadow: 0 0 ${props => props.$size * 2}px rgba(255, 255, 255, 0.5);
`

const OrbitContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  pointer-events: none;

  @media (max-width: 768px) {
    width: 500px;
    height: 500px;
  }
`

const Orbit = styled.div<{ $size: number; $duration: number; $delay: number; $color: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$size}%;
  height: ${props => props.$size}%;
  transform: translate(-50%, -50%);
  border: 1px solid ${props => props.$color};
  border-radius: 50%;
  opacity: 0.15;
`

const OrbitingSatellite = styled.div<{ $size: number; $duration: number; $delay: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$size}%;
  height: ${props => props.$size}%;
  transform: translate(-50%, -50%);
  animation: ${orbitPath} ${props => props.$duration}s linear infinite;
  animation-delay: ${props => props.$delay}s;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background: #4aa564;
    border-radius: 50%;
    box-shadow: 0 0 12px #4aa564, 0 0 24px rgba(74, 165, 100, 0.5);
  }
`

const HeroSection = styled.div`
  position: relative;
  z-index: 1;
  padding: 80px 20px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: calc(100vh - 64px);
  justify-content: center;
`

const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.8s ease-out;
  filter: drop-shadow(0 0 30px rgba(74, 165, 100, 0.4));
`

const Title = styled.h1`
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  animation: ${fadeInUp} 0.8s ease-out 0.1s both;
  
  span {
    background: linear-gradient(135deg, #4aa564 0%, #74bd8c 50%, #35864d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const Subtitle = styled.p`
  font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  font-size: clamp(1rem, 3vw, 1.25rem);
  color: rgba(255, 255, 255, 0.7);
  max-width: 640px;
  margin: 0 auto 48px;
  line-height: 1.7;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;

  a {
    color: #4aa564;
    text-decoration: none;
    border-bottom: 1px solid rgba(74, 165, 100, 0.3);
    transition: all 0.2s ease;

    &:hover {
      border-color: #4aa564;
    }
  }
`

const SearchContainer = styled.div`
  width: 100%;
  max-width: 480px;
  margin: 0 auto 64px;
  animation: ${fadeInUp} 0.8s ease-out 0.3s both;

  .MuiTextField-root {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    &:hover, &:focus-within {
      border-color: rgba(74, 165, 100, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .MuiInputBase-root {
    padding: 8px 16px;
  }

  .MuiInputBase-input {
    color: #ffffff;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 1rem;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.5);
  }

  .MuiInput-underline:before,
  .MuiInput-underline:after {
    display: none;
  }

  .MuiSvgIcon-root {
    color: rgba(255, 255, 255, 0.5);
  }
`

const SectionTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #4aa564;
  margin: 0 0 32px;
  animation: ${fadeInUp} 0.8s ease-out 0.4s both;
  
  &::before {
    content: '//';
    margin-right: 8px;
    opacity: 0.5;
  }
`

const PopularGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 900px;
  width: 100%;
  padding: 0 20px;
  animation: ${fadeInUp} 0.8s ease-out 0.5s both;
`

const SatelliteCard = styled.div<{ $delay: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.6s ease-out ${props => 0.5 + props.$delay * 0.05}s both;
  cursor: pointer;

  &:hover {
    background: rgba(74, 165, 100, 0.1);
    border-color: rgba(74, 165, 100, 0.3);
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #4aa564;
    border-radius: 50%;
    animation: ${pulse} 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(74, 165, 100, 0.6);
  }
`

const SatelliteName = styled.span`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DataSection = styled.div`
  position: relative;
  z-index: 1;
  padding: 80px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const DataContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`

const DataTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px;
`

const DataSubtitle = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
`

const BrowserWrapper = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
`

// Generate random stars
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  size: Math.random() * 2 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  delay: Math.random() * 3,
}))

const orbits = [
  { size: 40, duration: 20, delay: 0, color: '#4aa564' },
  { size: 60, duration: 30, delay: 5, color: '#74bd8c' },
  { size: 80, duration: 45, delay: 10, color: '#35864d' },
  { size: 100, duration: 60, delay: 15, color: '#4aa564' },
]

const popularProvider = new TlePopularProvider()
const tleProvider = new TleProvider()

const Home = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Tle | null>(null)
  const [popular, setPopular] = useState<Tle[]>([])

  useEffect(() => {
    popularProvider.get().then((result) => {
      if (result) {
        setPopular(result)
      }
    })
  }, [])

  useEffect(() => {
    if (id) {
      tleProvider.get(parseInt(id)).then((tle) => {
        if (tle) {
          setData(tle)
        }
      })
    }
  }, [id])

  const onChange = (tle: Tle | null) => {
    if (tle === null) {
      navigate('/')
    } else {
      navigate('/tle/' + tle.satelliteId)
    }
    updateTle(tle)
  }

  const updateTle = (tle: Tle | null) => {
    if (!tle) {
      return
    }
    setData(tle)
    window.scroll({
      top: window.innerHeight,
      behavior: 'smooth',
    })
  }

  return (
    <PageWrapper>
      <StarField>
        {stars.map((star) => (
          <Star
            key={star.id}
            $size={star.size}
            $top={star.top}
            $left={star.left}
            $delay={star.delay}
          />
        ))}
      </StarField>

      <OrbitContainer>
        {orbits.map((orbit, i) => (
          <Orbit
            key={i}
            $size={orbit.size}
            $duration={orbit.duration}
            $delay={orbit.delay}
            $color={orbit.color}
          />
        ))}
        <OrbitingSatellite $size={40} $duration={20} $delay={0} />
        <OrbitingSatellite $size={70} $duration={35} $delay={8} />
      </OrbitContainer>

      <HeroSection>
        <Logo src="images/logo.svg" alt="TLE API Logo" />
        <Title>
          <span>TLE</span> API
        </Title>
        <Subtitle>
          Real-time NORAD Two-Line Element sets for Earth-orbiting satellites.
          Data sourced from{' '}
          <a
            href="https://celestrak.com/"
            target="_blank"
            rel="nofollow noreferrer"
          >
            CelesTrak
          </a>
          , delivered in developer-friendly JSON format.
        </Subtitle>

        <SearchContainer>
          <TleSelect onChange={onChange} value={data} />
        </SearchContainer>

        <SectionTitle>Popular Satellites</SectionTitle>
        <PopularGrid>
          {popular.map((item, index) => (
            <SatelliteCard
              key={item.satelliteId}
              $delay={index}
              onClick={() => {
                navigate('/tle/' + item.satelliteId)
                updateTle(item)
              }}
            >
              <SatelliteName>{item.name}</SatelliteName>
            </SatelliteCard>
          ))}
        </PopularGrid>
      </HeroSection>

      {data?.name && (
        <DataSection>
          <DataContainer>
            <DataTitle>{data.name}</DataTitle>
            <DataSubtitle>
              Latest two-line element data for selected satellite
            </DataSubtitle>
            <BrowserWrapper>
              <TleBrowser data={data} />
            </BrowserWrapper>
          </DataContainer>
        </DataSection>
      )}
    </PageWrapper>
  )
}

export default Home
