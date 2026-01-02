import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import { Docs } from './pages/Docs'
import Navigation from './components/Navigation'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Health } from './pages/Health'
import { Browse } from './pages/Browse'
import * as Sentry from '@sentry/react'
import { isProduction } from './util/common'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4aa564',
      light: '#74bd8c',
      dark: '#35864d',
    },
    secondary: {
      main: '#0b3d91',
    },
    background: {
      default: '#0a0e1a',
      paper: '#0f1628',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
    h2: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
    h3: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
    h4: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
    h5: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
    h6: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

if (isProduction()) {
  Sentry.init({
    dsn: 'https://89c7162887474970b4d5e599245910b2@o509872.ingest.sentry.io/5604902',
  })
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router>
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tle/:id" element={<Home />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/operation/record" element={<Docs />} />
              <Route path="/operation/collection" element={<Docs />} />
              <Route path="/health" element={<Health />} />
              <Route path="/browse" element={<Browse />} />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  )
}

export default App
