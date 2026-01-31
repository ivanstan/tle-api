import { useState } from 'react'
import { TleParser } from '../services/TleParser'
import { When } from 'react-if'
import { CopyButton } from './CopyButton'
import { TleElementDetails } from './TleElementDetails'
import { LineNumber } from '../services/LineNumber'

enum TleElements {
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

interface TleBrowserProps {
  data: Tle | null
}

export const TleBrowser = ({ data: tleData }: TleBrowserProps) => {
  const [active, setActive] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)

  if (!tleData) return null

  const data = new TleParser(tleData)

  const hover = (element: string, domElement: React.MouseEvent<HTMLSpanElement>): void => {
    const styles = getComputedStyle(domElement.target as Element)
    setActive(element)
    setColor(styles.borderColor)
  }

  const overflow = window.innerWidth > 768 ? 'auto' : 'scroll'
  const isMobile = window.innerWidth < 768

  return (
    <>
      <div
        className="code tle-display d-flex flex-column flex-md-row justify-content-between"
        style={{ overflowX: overflow as 'auto' | 'scroll' }}
      >
        <div style={{ flex: 1 }}>
          <div className="name">
            <span
              className={'element name'}
              onMouseEnter={(element) => hover(TleElements.name, element)}
            >
              {data.name}
            </span>
          </div>

          <div className="line1" style={{ minWidth: isMobile ? 'auto' : 651 }}>
            <span
              className={'element line_number'}
              onMouseEnter={(element) => hover(TleElements.lineNumber1, element)}
            >
              {data.getLineNumberRaw(LineNumber.LINE1)}
            </span>
            &nbsp;
            <span
              className={'element satellite_id'}
              onMouseEnter={(element) => hover(TleElements.satelliteId1, element)}
            >
              {data.getSatelliteIdRaw(LineNumber.LINE1)}
            </span>
            <span
              className={'element classification'}
              onMouseEnter={(element) => hover(TleElements.classification, element)}
            >
              {data.getClassificationRaw()}
            </span>
            &nbsp;
            <span
              className={'element launch-year'}
              onMouseEnter={(element) => hover(TleElements.launchYear, element)}
            >
              {data.getLaunchYearRaw()}
            </span>
            <span
              className={'element launch-number'}
              onMouseEnter={(element) => hover(TleElements.launchOfYear, element)}
            >
              {data.getLaunchNumberOfTheYearRaw()}
            </span>
            <span
              className={'element launch-piece'}
              onMouseEnter={(element) => hover(TleElements.launchPiece, element)}
            >
              {data.getLaunchPieceRaw()}
            </span>
            &nbsp;
            <span
              className={'element epoch-year'}
              onMouseEnter={(element) => hover(TleElements.epochYear, element)}
            >
              {data.getEpochYearRaw()}
            </span>
            <span
              className={'element epoch-day'}
              onMouseEnter={(element) => hover(TleElements.epochDay, element)}
            >
              {data.getEpochDayRaw()}
            </span>
            &nbsp;
            <span
              className={'element first-derivative'}
              onMouseEnter={(element) => hover(TleElements.firstDerivative, element)}
            >
              {data.getFirstTimeDerivativeOfMeanMotionRaw()}
            </span>
            &nbsp;
            <span
              className={'element second-derivative'}
              onMouseEnter={(element) => hover(TleElements.secondDerivative, element)}
            >
              {data.getSecondTimeDerivativeOfMeanMotionRaw()}
            </span>
            &nbsp;
            <span
              className={'element drag-term'}
              onMouseEnter={(element) => hover(TleElements.dragTerm, element)}
            >
              {data.getBstarDragTermRaw()}
            </span>
            &nbsp;
            <span
              className={'element ephemeris-type'}
              onMouseEnter={(element) => hover(TleElements.ephemerisType, element)}
            >
              {data.getEphemerisTypeRaw()}
            </span>
            &nbsp;
            <span
              className={'element element-number'}
              onMouseEnter={(element) => hover(TleElements.elementNumber, element)}
            >
              {data.getElementNumberRaw()}
            </span>
            <span
              className={'element checksum'}
              onMouseEnter={(element) => hover(TleElements.checkSum1, element)}
            >
              {data.getLineChecksumRaw(LineNumber.LINE1)}
            </span>
          </div>

          <div className="line2" style={{ minWidth: isMobile ? 'auto' : 651 }}>
            <span
              className={'element line_number'}
              onMouseEnter={(element) => hover(TleElements.lineNumber2, element)}
            >
              {data.getLineNumberRaw(LineNumber.LINE2)}
            </span>
            &nbsp;
            <span
              className={'element satellite_id'}
              onMouseEnter={(element) => hover(TleElements.satelliteId2, element)}
            >
              {data.getSatelliteIdRaw(LineNumber.LINE2)}
            </span>
            &nbsp;
            <span
              className={'element inclination'}
              onMouseEnter={(element) => hover(TleElements.inclination, element)}
            >
              {data.getInclinationRaw()}
            </span>
            &nbsp;
            <span
              className={'element raan'}
              onMouseEnter={(element) => hover(TleElements.raan, element)}
            >
              {data.getRightAscensionOfAscendingNodeRaw()}
            </span>
            &nbsp;
            <span
              className={'element eccentricity'}
              onMouseEnter={(element) => hover(TleElements.eccentricity, element)}
            >
              {data.getEccentricityRaw()}
            </span>
            &nbsp;
            <span
              className={'element argument-of-perigee'}
              onMouseEnter={(element) => hover(TleElements.argumentOfPerigee, element)}
            >
              {data.getArgumentOfPerigeeRaw()}
            </span>
            &nbsp;
            <span
              className={'element mean-anomaly'}
              onMouseEnter={(element) => hover(TleElements.meanAnomaly, element)}
            >
              {data.getMeanAnomalyRaw()}
            </span>
            &nbsp;
            <span
              className={'element mean-motion'}
              onMouseEnter={(element) => hover(TleElements.meanMotion, element)}
            >
              {data.getMeanMotionRaw()}
            </span>
            &nbsp;
            <span
              className={'element revolution-number'}
              onMouseEnter={(element) => hover(TleElements.revolutionNumber, element)}
            >
              {data.getRevolutionNumberRaw()}
            </span>
            <span
              className={'element checksum'}
              onMouseEnter={(element) => hover(TleElements.checksum2, element)}
            >
              {data.getLineChecksumRaw(LineNumber.LINE2)}
            </span>
          </div>
        </div>
        <div className="align-self-center mt-2 mt-md-0 ms-md-3">
          <CopyButton value={data.line1 + '\n' + data.line2} />
        </div>
      </div>

      <div className={'d-flex flex-column flex-md-row pt-2'} style={{ fontSize: 12 }}>
        <span className={'d-none d-md-inline mb-1 mb-md-0'}>
          Get daily updates for {data.name} using following API endpoint&nbsp;
        </span>
        <span className={'d-block d-md-none mb-1 fw-bold'}>API endpoint:</span>
        <a
          target="_blank"
          rel="nofollow noreferrer"
          href={'https://tle.ivanstanojevic.me/api/tle/' + data.satelliteId}
          style={{ wordBreak: 'break-all' }}
        >
          https://tle.ivanstanojevic.me/api/tle/{data.satelliteId}
        </a>
      </div>

      <div className="details mt-2">
        <When condition={active === TleElements.name}>
          <TleElementDetails color={color} title={'Satellite name'} />
        </When>

        <When condition={active === TleElements.lineNumber1 || active === TleElements.lineNumber2}>
          <TleElementDetails color={color} title={'Line number'} />
        </When>

        <When condition={active === TleElements.satelliteId1 || active === TleElements.satelliteId2}>
          <TleElementDetails color={color} title={'Satellite number'} />
        </When>

        <When condition={active === TleElements.checkSum1 || active === TleElements.checksum2}>
          <TleElementDetails color={color} title={'Checksum'} />
        </When>

        <When condition={active === TleElements.classification}>
          <TleElementDetails color={color} title={'Classification'} />
        </When>

        <When condition={active === TleElements.launchYear}>
          <TleElementDetails color={color} title={'Launch year'} />
        </When>

        <When condition={active === TleElements.launchOfYear}>
          <TleElementDetails color={color} title={'Launch number of year'} />
        </When>

        <When condition={active === TleElements.launchPiece}>
          <TleElementDetails color={color} title={'Launch piece'} />
        </When>

        <When condition={active === TleElements.epochYear || active === TleElements.epochDay}>
          <TleElementDetails color={color} title={'Epoch'} />
        </When>

        <When condition={active === TleElements.firstDerivative}>
          <TleElementDetails color={color} title={'First time derivative of mean motion'} />
        </When>

        <When condition={active === TleElements.secondDerivative}>
          <TleElementDetails color={color} title={'Second time derivative of mean motion'} />
        </When>

        <When condition={active === TleElements.dragTerm}>
          <TleElementDetails color={color} title={'BSTAR Drag term'} />
        </When>

        <When condition={active === TleElements.ephemerisType}>
          <TleElementDetails color={color} title={'Ephemeris type'} />
        </When>

        <When condition={active === TleElements.elementNumber}>
          <TleElementDetails color={color} title={'Element number'} />
        </When>

        <When condition={active === TleElements.inclination}>
          <TleElementDetails color={color} title={'Inclination'} />
        </When>

        <When condition={active === TleElements.raan}>
          <TleElementDetails color={color} title={'Right ascension of the ascending node'} />
        </When>

        <When condition={active === TleElements.eccentricity}>
          <TleElementDetails color={color} title={'Eccentricity'} />
        </When>

        <When condition={active === TleElements.argumentOfPerigee}>
          <TleElementDetails color={color} title={'Argument of perigee'} />
        </When>

        <When condition={active === TleElements.meanAnomaly}>
          <TleElementDetails color={color} title={'Mean anomaly'} />
        </When>

        <When condition={active === TleElements.meanMotion}>
          <TleElementDetails color={color} title={'Mean motion'} />
        </When>

        <When condition={active === TleElements.revolutionNumber}>
          <TleElementDetails color={color} title={'Revolution number'} />
        </When>
      </div>
    </>
  )
}
