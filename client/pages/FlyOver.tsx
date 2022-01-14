import React from "react"
import { inject, observer } from "mobx-react"
import { RouteComponentProps } from "react-router"
import { Observer } from "../services/Observer"
import { FlyOverStore } from "../services/FlyOverStore"
import { formatDiff, fromAtom } from "../util/date"
import { GeoMap } from "../components/GeoMap"
import { Link, List, ListItem, ListItemText } from "@material-ui/core"
import { If } from "react-if";
import RoomIcon from '@material-ui/icons/Room';
import Tooltip from '@material-ui/core/Tooltip';

type RouteParams = {
  id: string
}

interface FlyOverPropsInterface extends RouteComponentProps<RouteParams> {
  observer: Observer,
  flyOverStore: FlyOverStore
}

@inject('observer', 'flyOverStore')
@observer
export class FlyOver extends React.Component<FlyOverPropsInterface, any> {

  public constructor(props: FlyOverPropsInterface) {
    super(props)

    const { flyOverStore } = this.props

    const { id } = this.props.match.params
    flyOverStore.tle = id
  }

  async componentDidMount() {
    //
    // let flyOver = null
    // if (tle) {
    //   flyOver = await TleApi.flyOver(tle, observer.position)
    // }
    //
    // this.setState({ flyOver: flyOver, data: tle })
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      const { flyOverStore } = this.props
      const { id } = nextProps.match.params
      flyOverStore.tle = id
    }
  }

  render() {
    // const { flyOver, data } = this.state
    const { observer, flyOverStore } = this.props

    let flyovers = flyOverStore.flyovers.get()

    if (!flyovers.hasOwnProperty('member')) {
      return null
    }

    const timezone = flyovers.observer.timezone

    let observerTime = fromAtom(flyovers.observer.date)

    return (
      <div className={'d-flex p-4'}>
        <div className={'flex-grow-1 d-flex'}>
          <div className={'flex-grow-1'} style={{ maxHeight: '50%' }}>
            <GeoMap
              renderObserver={true}
              containerElement={<div style={{ height: 400, width: '100%' }}/>}
              mapElement={<div style={{ height: 400 }}/>}
            />
            <span style={{ fontSize: 12 }}>
              * Click on map or drag marker to change your location
            </span>
          </div>
        </div>

        <div className={'flex-grow-1'} style={{ paddingLeft: 24 }}>

          <div style={{paddingLeft: 16, paddingRight: 16}}>
            <h1 className="h5">
              {flyovers.tle.name} visible flyovers for location
            </h1>
            <h5>[ latitude: {observer.position.latitude.toFixed(2)}°,
              longitude: {observer.position.longitude.toFixed(2)}° ]</h5>
          </div>

          <List dense style={{overflowY: 'scroll', maxHeight: 'calc(100vh - 64px - 24px - 56px - 32px)'}}>
            {
              flyovers.member.map((element: any, index: number) => {
                let aosTime = fromAtom(element.aos.date)
                let losTime = fromAtom(element.los.date)
                let maxTime = fromAtom(element.max.date)

                let diff = aosTime.diff(observerTime, ['days', 'hours', 'minutes', 'seconds'])

                let params = new URLSearchParams({
                  'id[]': flyOverStore.tle,
                  'date': element.max.date,
                })

                let mapLink = '#/map?' + decodeURIComponent(params.toString())

                return (
                  <ListItem key={index}>
                    <ListItemText
                      primary={'AOS ' + aosTime.toFormat('HH:mm:ss yyyy-MM-dd ZZ')}
                      secondary={formatDiff(diff)}
                    />
                    <Tooltip title="Show on map" placement='left'>
                      <Link href={mapLink}><RoomIcon style={{fill: "#5BA473"}}/></Link>
                    </Tooltip>
                  </ListItem>
                )
              })
            }

            <If condition={flyovers.member.length === 0}>
              <ListItem>
                No flyovers found here.
              </ListItem>
            </If>
          </List>
        </div>
      </div>
    )
  }
}
