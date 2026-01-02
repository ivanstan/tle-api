import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TleSelect } from '../components/TleSelect'
import { TleBrowser } from '../components/TleBrowser'
import { TlePopularProvider } from '../services/TlePopularProvider'
import { Link } from '@mui/material'
import styled from 'styled-components'
import { device } from '../util/responsive'
import { TleProvider } from '../services/TleProvider'

const PopularWrapper = styled.div`
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 5fr));

  @media ${device.tablet} {
    margin-right: 100px;
    margin-left: 100px;
  }

  @media ${device.laptop} {
    margin-right: 100px;
    margin-left: 100px;
  }
`

const CenterTitle = styled.p`
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
`

const PopularItemWrapper = styled.div``

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
      top: window.innerHeight + 64,
      behavior: 'smooth',
    })
  }

  return (
    <div className="container" id="home-page">
      <div className="row slide-container bg-white">
        <div className="col-12 slide-container">
          <div className="first-slide">
            <img
              src="images/logo.svg"
              width={180}
              alt={'TLE API Logo'}
              className={'d-block mx-auto py-4'}
            />
            <h1 className={'text-center'}>TLE API</h1>
            <p className={'py-4'}>
              API provides up to date NORAD two line element sets for number of
              Earth orbiting satellites. Data is provided by&nbsp;
              <a
                href={'https://celestrak.com/'}
                target="_blank"
                rel="nofollow noreferrer"
              >
                CelesTrak
              </a>
              &nbsp;and served in web application friendly JSON format. A
              two-line element set (TLE) is a data format encoding of orbital
              elements of an Earth-orbiting object for a given point in time.
            </p>

            <CenterTitle>Recently popular satellites</CenterTitle>
            <PopularWrapper>
              {popular.map((item) => {
                return (
                  <PopularItemWrapper key={item.satelliteId}>
                    <Link href={'#/tle/' + item.satelliteId}>{item.name}</Link>
                  </PopularItemWrapper>
                )
              })}
            </PopularWrapper>

            <CenterTitle>Search for satellite of your interest</CenterTitle>
            <TleSelect onChange={onChange} value={data} />
          </div>

          {data?.name && (
            <div className="slide">
              <h2>{data.name}</h2>
              <p className="pb-1">
                Latest two line element data for selected satellite
              </p>
              <TleBrowser data={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
