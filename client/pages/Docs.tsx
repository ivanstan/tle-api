import React from "react"
import { RedocStandalone } from "redoc"
import { isProduction } from "../util/common"

const PRODUCTION_DOCS = 'https://tle.ivanstanojevic.me/api/tle.json'
const DEVELOPMENT_DOCS = 'http://127.0.0.1:8000/api/tle.json'

export class Docs extends React.Component {

  render() {
    return <>
      <RedocStandalone
        specUrl={isProduction() ? PRODUCTION_DOCS : DEVELOPMENT_DOCS}
        options={{
          nativeScrollbars: true,
          disableSearch: true,
          expandResponses: "200,201",
          hideDownloadButton: true,
          theme: {
            colors: {
              success: { main: '#4aa564', },
              primary: { main: '#0b3d91' },
              error: { main: '#dd361c' },
              http: {
                get: '#4aa564',
              }
            },
            rightPanel: {
              backgroundColor: '#212121'
            },
          },
        }}
      />
    </>
  }
}
