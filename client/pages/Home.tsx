import React from "react"
import { TleSelect } from "../components/TleSelect"
import { TleBrowser } from "../components/TleBrowser"
import { TlePopularProvider } from "../services/TlePopularProvider"
import { Link } from "@material-ui/core"
import styled from "styled-components"
import { device } from "../util/responsive"
import AbstractTlePage, { AbstractTlePageStateInterface } from "./AbstractTlePage"

interface HomeStateInterface extends AbstractTlePageStateInterface {
  popular: any[]
}

const PopularWrapper = styled.div`
  margin-bottom: 20px;

  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(260px, 5fr));

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

class Home extends AbstractTlePage<any, HomeStateInterface> {

  private popular: TlePopularProvider

  constructor(props: any) {
    super(props)

    this.popular = new TlePopularProvider()
  }

  readonly state: HomeStateInterface = {
    data: null,
    popular: [],
  }

  componentDidMount() {
    super.componentDidMount()
    this.provider.search().then((data: any) => {
      if (data) {
        this.setState({ popular: data })
      }
    })
  }

  onChange = (tle: any | null) => {
    if (tle === null) {
      this.props.history.push('/')
    } else {
      this.props.history.push('/tle/' + tle.satelliteId)
    }

    this.updateTle(tle)
  }

  protected updateTle = (tle: any|null) => {
    if (!tle) {
      return
    }

    this.setState({
      data: tle
    })
    window.scroll({
      top: window.innerHeight + 64,
      behavior: 'smooth'
    })
  }

  public render() {
    const { data, popular } = this.state

    return (
      <div className="container" id="home-page">
        <div className="row slide-container bg-white">
          <div className="col-12 slide-container">

            <div className="first-slide">
              <img src="images/logo.svg" width={180} alt={"TLE API Logo"} className={"d-block mx-auto py-4"}/>
              <h1 className={"text-center"}>TLE API</h1>
              <p className={'py-4'}>
                API provides up to date NORAD two line element sets for number of Earth orbiting satellites. Data is
                provided
                by&nbsp;<a href={"https://celestrak.com/"}
                           target="_blank"
                           rel="nofollow noreferrer">CelesTrak</a>&nbsp;and served in web application friendly JSON format.
                A two-line element set (TLE) is a data format encoding of orbital elements of an Earth-orbiting
                object for a given point in time.
              </p>

              <CenterTitle>Recently popular satellites</CenterTitle>
              <PopularWrapper>
                {popular.map(item => {
                  return (
                    <PopularItemWrapper key={item.satelliteId}>
                      <Link  href={'#/tle/' + item.satelliteId}>{item.name}</Link>
                    </PopularItemWrapper>
                  )
                })}
              </PopularWrapper>

              <CenterTitle>Search for satellite of your interest</CenterTitle>
              <TleSelect onChange={this.onChange} value={data}/>
            </div>

            {data?.name && <div className="slide">
              <h2>{data.name}</h2>

              <p className="pb-1">Latest two line element data for selected satellite</p>

              <TleBrowser data={data}/>

            </div>}
          </div>
        </div>
      </div>
    )
  }
}

export default Home
