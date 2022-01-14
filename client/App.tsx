import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Home from "./pages/Home";
import { Docs } from "./pages/Docs";
import Navigation from "./components/Navigation";
import { createMuiTheme, ThemeProvider } from "@material-ui/core";
import { Health } from "./pages/Health";
import { Browse } from "./pages/Browse";
import { Map } from "./pages/Map";
import * as Sentry from "@sentry/react";
import { isProduction } from "./util/common";
import { FlyOver } from "./pages/FlyOver";
import { Provider } from 'mobx-react';
import Observer from "./services/Observer";
import FlyOverStore from "./services/FlyOverStore";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#0b3d91',
    },
  },
  overrides: {
    MuiButton: {
      label: {
        color: "#0b3d91",
      },
    },
  },
});

if (isProduction()) {
  Sentry.init({ dsn: "https://89c7162887474970b4d5e599245910b2@o509872.ingest.sentry.io/5604902" });
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={"An error has occurred"}>
      <ThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Provider observer={Observer} flyOverStore={FlyOverStore}>
          <Router>
            <Navigation/>
            <Switch>
              <Route path="/" exact component={Home}/>
              <Route path="/tle/:id" exact component={Home}/>
              <Route path="/tle/:id/flyover" exact component={FlyOver}/>

              <Route path="/docs" exact component={Docs}/>
              <Route path="/operation/record" exact component={Docs}/>
              <Route path="/operation/collection" exact component={Docs}/>

              <Route path="/health" exact component={Health}/>
              <Route path="/browse" exact component={Browse}/>

              <Route path="/map" exact component={Map}/>
            </Switch>
            <Route path="/" component={GoogleAnalytics}/>
          </Router>
        </Provider>
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App
