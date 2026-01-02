import { RedocStandalone } from 'redoc'
import { isProduction } from '../util/common'

const PRODUCTION_DOCS = 'https://tle.ivanstanojevic.me/api/tle.json'
const DEVELOPMENT_DOCS = 'http://127.0.0.1:8000/api/tle.json'

export const Docs = () => {
  return (
    <RedocStandalone
      specUrl={isProduction() ? PRODUCTION_DOCS : DEVELOPMENT_DOCS}
      options={{
        nativeScrollbars: true,
        disableSearch: true,
        expandResponses: '200,201',
        hideDownloadButton: true,
        theme: {
          colors: {
            tonalOffset: 0.2,
            primary: { main: '#d4a556' },
            success: { main: '#6cbf84' },
            warning: { main: '#e8a550' },
            error: { main: '#e05858' },
            text: {
              primary: '#1a1a2e',
              secondary: '#4a4a68',
            },
            http: {
              get: '#3498db',
              post: '#6cbf84',
              put: '#e8a550',
              delete: '#e05858',
              patch: '#9b6dd4',
            },
            responses: {
              success: { color: '#2c5e3f', backgroundColor: 'rgba(108, 191, 132, 0.12)' },
              error: { color: '#8b2d2d', backgroundColor: 'rgba(224, 88, 88, 0.1)' },
            },
          },
          typography: {
            fontSize: '15px',
            fontFamily: '"Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif',
            headings: {
              fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: '600',
            },
            code: {
              fontSize: '13px',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              color: '#c75a5a',
            },
          },
          sidebar: {
            backgroundColor: '#fafbfc',
            textColor: '#4a4a68',
            activeTextColor: '#d4a556',
            groupItems: {
              textTransform: 'uppercase',
            },
          },
          rightPanel: {
            backgroundColor: '#1e2433',
            textColor: '#e8e8ed',
          },
          codeBlock: {
            backgroundColor: '#161a24',
          },
        },
      }}
    />
  )
}
