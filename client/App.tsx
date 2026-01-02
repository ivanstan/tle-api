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

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b3d91',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#0b3d91',
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
    <Sentry.ErrorBoundary fallback={'An error has occurred'}>
      <ThemeProvider theme={theme}>
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
