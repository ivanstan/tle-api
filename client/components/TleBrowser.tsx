import React from "react"
import { LineNumber, TleParser } from "../services/TleParser"
import { If } from 'react-if'
import { CopyButton } from "./CopyButton"
import { TleElementDetails } from "./TleElementDetails"

enum TleElements {
  // Line1 elements
  name = 'name',
  lineNumber1 = 'line-number-1',
  satelliteId1 = 'satellite-id',
  classification = 'classification',
  launchYear = 'launch-year',
  launchOfYear = 'launch-of-year',
  launchPiece = 'launch-piece',
  epochYear = 'epoch-year',
  epochDay = 'epoch-day',
  firstDerivative = 'first-derivative',
  secondDerivative = 'second-derivative',
  dragTerm = 'drag-term',
  ephemerisType = 'ephemeris-type',
  elementNumber = 'element-number',
  checkSum1 = 'checksum-1',

  // Line2 elements
  lineNumber2 = 'line-number-2',
  satelliteId2 = 'satellite-id-2',
  inclination = 'inclination',
  raan = 'raan',
  eccentricity = 'eccentricity',
  argumentOfPerigee = 'argument-of-perigee',
  meanAnomaly = 'mean-anomaly',
  meanMotion = 'mean-motion',
  revolutionNumber = 'revolution-number',
  checksum2 = 'checksum-2',
}

export class TleBrowser extends React.Component<any, any> {

  readonly state = {
    active: null,
    color: null,
  }

  hover = (element: string, domElement: any): void => {
    const styles: any = getComputedStyle(domElement.target)
    this.setState({ active: element, color: styles['border-color'] })
  }

  render() {
    const { active, color } = this.state
    const data = new TleParser(this.props.data)

    let overflow:any = (window.innerWidth > 500) ? 'auto' : 'scroll'

    return <>
      <div className="code tle-display d-flex justify-content-between" style={{overflowX: overflow}}>
        <div>
          <div className="name">
            <span className={'element name'}
                  onMouseEnter={(element) => this.hover(TleElements.name, element)}>{data.name}</span>
          </div>
          {/*<div>{data.line1}</div>*/}

          <div className="line1" style={{minWidth: 651}}>
          <span className={'element line_number'}
                onMouseEnter={(element) => this.hover(TleElements.lineNumber1, element)}>{data.getLineNumberRaw(LineNumber.LINE1)}</span>
            &nbsp;
            <span className={'element satellite_id'}
                  onMouseEnter={(element) => this.hover(TleElements.satelliteId1, element)}>{data.getSatelliteIdRaw(LineNumber.LINE1)}</span>
            <span className={'element classification'}
                  onMouseEnter={(element) => this.hover(TleElements.classification, element)}>{data.getClassificationRaw()}</span>
            &nbsp;
            <span className={'element launch-year'}
                  onMouseEnter={(element) => this.hover(TleElements.launchYear, element)}>{data.getLaunchYearRaw()}</span>
            <span className={'element launch-number'}
                  onMouseEnter={(element) => this.hover(TleElements.launchOfYear, element)}>{data.getLaunchNumberOfTheYearRaw()}</span>
            <span className={'element launch-piece'}
                  onMouseEnter={(element) => this.hover(TleElements.launchPiece, element)}>{data.getLaunchPieceRaw()}</span>
            &nbsp;
            <span className={'element epoch-year'}
                  onMouseEnter={(element) => this.hover(TleElements.epochYear, element)}>{data.getEpochYearRaw()}</span>
            <span className={'element epoch-day'}
                  onMouseEnter={(element) => this.hover(TleElements.epochDay, element)}>{data.getEpochDayRaw()}</span>
            &nbsp;
            <span className={'element first-derivative'}
                  onMouseEnter={(element) => this.hover(TleElements.firstDerivative, element)}>{data.getFirstTimeDerivativeOfMeanMotionRaw()}</span>
            &nbsp;
            <span className={'element second-derivative'}
                  onMouseEnter={(element) => this.hover(TleElements.secondDerivative, element)}>{data.getSecondTimeDerivativeOfMeanMotionRaw()}</span>
            &nbsp;
            <span className={'element drag-term'}
                  onMouseEnter={(element) => this.hover(TleElements.dragTerm, element)}>{data.getBstarDragTermRaw()}</span>
            &nbsp;
            <span className={'element ephemeris-type'}
                  onMouseEnter={(element) => this.hover(TleElements.ephemerisType, element)}>{data.getEphemerisTypeRaw()}</span>
            &nbsp;
            <span className={'element element-number'}
                  onMouseEnter={(element) => this.hover(TleElements.elementNumber, element)}>{data.getElementNumberRaw()}</span>
            <span className={'element checksum'}
                  onMouseEnter={(element) => this.hover(TleElements.checkSum1, element)}>{data.getLineChecksumRaw(LineNumber.LINE1)}</span>
          </div>

          {/*<div>{data.line2}</div>*/}
          <div className="line2">
          <span className={'element line_number'}
                onMouseEnter={(element) => this.hover(TleElements.lineNumber2, element)}>{data.getLineNumberRaw(LineNumber.LINE2)}</span>
            &nbsp;
            <span className={'element satellite_id'}
                  onMouseEnter={(element) => this.hover(TleElements.satelliteId2, element)}>{data.getSatelliteIdRaw(LineNumber.LINE2)}</span>
            &nbsp;
            <span className={'element inclination'}
                  onMouseEnter={(element) => this.hover(TleElements.inclination, element)}>{data.getInclinationRaw()}</span>
            &nbsp;
            <span className={'element raan'}
                  onMouseEnter={(element) => this.hover(TleElements.raan, element)}>{data.getRightAscensionOfAscendingNodeRaw()}</span>
            &nbsp;
            <span className={'element eccentricity'}
                  onMouseEnter={(element) => this.hover(TleElements.eccentricity, element)}>{data.getEccentricityRaw()}</span>
            &nbsp;
            <span className={'element argument-of-perigee'}
                  onMouseEnter={(element) => this.hover(TleElements.argumentOfPerigee, element)}>{data.getArgumentOfPerigeeRaw()}</span>
            &nbsp;
            <span className={'element mean-anomaly'}
                  onMouseEnter={(element) => this.hover(TleElements.meanAnomaly, element)}>{data.getMeanAnomalyRaw()}</span>
            &nbsp;
            <span className={'element mean-motion'}
                  onMouseEnter={(element) => this.hover(TleElements.meanMotion, element)}>{data.getMeanMotionRaw()}</span>
            &nbsp;
            <span className={'element revolution-number'}
                  onMouseEnter={(element) => this.hover(TleElements.revolutionNumber, element)}>{data.getRevolutionNumberRaw()}</span>
            <span className={'element checksum'}
                  onMouseEnter={(element) => this.hover(TleElements.checksum2, element)}>{data.getLineChecksumRaw(LineNumber.LINE2)}</span>
          </div>
        </div>
        <div className="align-self-center d-none d-md-block">
          <CopyButton value={data.line1 + "\n" + data.line2}/>
        </div>
      </div>

      <div className={'d-flex pt-1'} style={{fontSize: 12}}>
        <span className={"d-none d-md-inline"}>Get daily updates for {data.name} using following API endpoint&nbsp;</span>
        <a
          target="_blank"
          rel="nofollow noreferrer"
          href={'https://tle.ivanstanojevic.me/api/tle/' + data.satelliteId}>https://tle.ivanstanojevic.me/api/tle/{data.satelliteId}</a>
      </div>

      <div className="details">
        <If condition={active === TleElements.name}>
          <TleElementDetails color={color} title={'Satellite name'}/>
        </If>

        <If condition={active === TleElements.lineNumber1 || active === TleElements.lineNumber2}>
          <TleElementDetails color={color} title={'Line number'}/>
        </If>

        <If condition={active === TleElements.satelliteId1 || active === TleElements.satelliteId2}>
          <TleElementDetails color={color} title={'Satellite number'}/>
        </If>

        <If condition={active === TleElements.checkSum1 || active === TleElements.checksum2}>
          <TleElementDetails color={color} title={'Checksum'}/>
        </If>

        <If condition={active === TleElements.classification}>
          <TleElementDetails color={color} title={'Classification'}/>
        </If>

        <If condition={active === TleElements.launchYear}>
          <TleElementDetails color={color} title={'Launch year'}/>
        </If>

        <If condition={active === TleElements.launchOfYear}>
          <TleElementDetails color={color} title={'Launch number of year'}/>
        </If>

        <If condition={active === TleElements.launchPiece}>
          <TleElementDetails color={color} title={'Launch piece'}/>
        </If>

        <If condition={active === TleElements.epochYear || active === TleElements.epochDay}>
          <TleElementDetails color={color} title={'Epoch'}/>
        </If>

        <If condition={active === TleElements.firstDerivative}>
          <TleElementDetails color={color} title={'First time derivative of mean motion'}/>
        </If>

        <If condition={active === TleElements.secondDerivative}>
          <TleElementDetails color={color} title={'Second time derivative of mean motion'}/>
        </If>

        <If condition={active === TleElements.dragTerm}>
          <TleElementDetails color={color} title={'BSTAR Drag term'}/>
        </If>

        <If condition={active === TleElements.ephemerisType}>
          <TleElementDetails color={color} title={'Ephemeris type'}/>
        </If>

        <If condition={active === TleElements.elementNumber}>
          <TleElementDetails color={color} title={'Element number'}/>
        </If>

        <If condition={active === TleElements.inclination}>
          <TleElementDetails color={color} title={'Inclination'}/>
        </If>

        <If condition={active === TleElements.raan}>
          <TleElementDetails color={color} title={'Right ascension of the ascending node'}/>
        </If>

        <If condition={active === TleElements.eccentricity}>
          <TleElementDetails color={color} title={'Eccentricity'}/>
        </If>

        <If condition={active === TleElements.argumentOfPerigee}>
          <TleElementDetails color={color} title={'Argument of perigee'}/>
        </If>

        <If condition={active === TleElements.meanAnomaly}>
          <TleElementDetails color={color} title={'Mean anomaly'}/>
        </If>

        <If condition={active === TleElements.meanMotion}>
          <TleElementDetails color={color} title={'Mean motion'}/>
        </If>

        <If condition={active === TleElements.revolutionNumber}>
          <TleElementDetails color={color} title={'Revolution number'}/>
        </If>
      </div>

    </>
  }

}
