import React from "react"
import { Tle, TleProvider } from "tle-client"
import { RouteComponentProps } from "react-router"

export interface AbstractTlePageStateInterface {
  data: any | null
}

type RouteParams = {
  id: string
}

abstract class AbstractTlePage<P extends RouteComponentProps<RouteParams>, S extends AbstractTlePageStateInterface> extends React.Component<RouteComponentProps<RouteParams>, S> {

  protected provider: TleProvider

  readonly state: any = {
    data: null,
  }

  protected constructor(props: RouteComponentProps<RouteParams>) {
    super(props)

    this.provider = new TleProvider()
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      const { id } = nextProps.match.params

      if (id) {
        this.provider.get(id).then(tle => this.updateTle(tle))
      }
    }
  }

  componentDidMount() {
    const { id } = this.props.match.params

    if (id) {
      this.provider.get(parseInt(id)).then(tle => this.updateTle(tle))
    }
  }

  protected updateTle = (tle: Tle | null) => {
    if (!tle) {
      return
    }

    this.setState({
      data: tle
    })
  }
}

export default AbstractTlePage
