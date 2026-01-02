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
            primary: { main: '#e8b866' },
            success: { main: '#6cbf84' },
            warning: { main: '#e8a550' },
            error: { main: '#e05858' },
            text: {
              primary: '#f0f0f5',
              secondary: '#b8b8c8',
            },
            http: {
              get: '#5dade2',
              post: '#7dcea0',
              put: '#f0b866',
              delete: '#ec7063',
              patch: '#bb8fce',
            },
            responses: {
              success: { color: '#7dcea0', backgroundColor: 'rgba(108, 191, 132, 0.15)' },
              error: { color: '#ec7063', backgroundColor: 'rgba(224, 88, 88, 0.12)' },
            },
            border: {
              dark: 'rgba(255, 255, 255, 0.12)',
              light: 'rgba(255, 255, 255, 0.06)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f0b866',
            },
            links: {
              color: '#e8b866',
              hover: '#f5d090',
            },
          },
          sidebar: {
            backgroundColor: '#141822',
            textColor: '#a0a0b8',
            activeTextColor: '#e8b866',
            arrow: {
              color: '#a0a0b8',
            },
            groupItems: {
              textTransform: 'uppercase',
            },
          },
          rightPanel: {
            backgroundColor: '#1a1f2c',
            textColor: '#e8e8f0',
          },
          codeBlock: {
            backgroundColor: '#12161e',
          },
        },
      }}
    />
  )
}
