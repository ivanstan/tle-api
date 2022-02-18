import React from "react";
import {RouteComponentProps} from "react-router";

export interface AbstractPagePropsInterface extends RouteComponentProps {

}

export interface AbstractPageStateInterface {
  routeParams: any
  queryParams: URLSearchParams
}

export abstract class AbstractPage<P, S> extends React.Component<AbstractPagePropsInterface, AbstractPageStateInterface> {

  readonly state = {
    routeParams: [],
    queryParams: new URLSearchParams(),
  }

  shouldComponentUpdate(nextProps: Readonly<AbstractPagePropsInterface>, nextState: Readonly<AbstractPageStateInterface>, nextContext: any): boolean {
    return (nextProps.match.params !== this.props.match.params) || (nextProps.location.search !== this.props.location.search);
  }

  public static getDerivedStateFromProps(props: Readonly<AbstractPagePropsInterface>, state: Readonly<AbstractPageStateInterface>): AbstractPageStateInterface {
    return {
      routeParams: props.match.params,
      queryParams: new URLSearchParams(props.location.search)
    }
  }

  updateUrl(path: null, query: URLSearchParams) {
    const { history } = this.props;

    history.push({
      pathname: history.location.pathname,
      search: decodeURIComponent(query.toString()),
    });
  }
}
