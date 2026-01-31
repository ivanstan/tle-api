import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Chip } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import FiberNewIcon from '@mui/icons-material/FiberNew'
import PublicIcon from '@mui/icons-material/Public'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import FilterListIcon from '@mui/icons-material/FilterList'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const NewsContainer = styled.div`
  position: relative;
  z-index: 1;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const NewsContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  animation: ${fadeInUp} 0.8s ease-out;
`

const NewsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`

const NewsBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #4aa564 0%, #35864d 100%);
  border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(74, 165, 100, 0.3);
`

const NewsTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const NewsDescription = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.125rem);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin: 0 0 32px;
`

const ExamplesSection = styled.div`
  margin-top: 24px;
`

const ExamplesTitle = styled.h3`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px;
  
  &::before {
    content: '//';
    margin-right: 8px;
    color: #4aa564;
  }
`

const FilterExamplesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`

const ExampleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  flex: 1;
  min-width: 200px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(74, 165, 100, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 165, 100, 0.2);
  }
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
`

const ExampleLabel = styled.div`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
`

const ExampleFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

export const NewsSection = () => {
  const navigate = useNavigate()

  const handleFilterClick = (filters: string[]) => {
    const params = new URLSearchParams()
    filters.forEach(filter => params.set(filter, '1'))
    navigate(`/browse?${params.toString()}`)
  }

  return (
    <NewsContainer>
      <NewsContent>
        <NewsHeader>
          <NewsBadge>
            <FilterListIcon style={{ fontSize: '1rem' }} />
            New Feature
          </NewsBadge>
        </NewsHeader>
        
        <NewsTitle>Advanced Satellite Filtering</NewsTitle>
        
        <NewsDescription>
          Explore our satellite database with powerful filtering capabilities. Filter by orbit type, 
          characteristics, and more. Click on any filter tag in the table or use the filter bar to 
          narrow down your search. Share filtered results with shareable URLs.
        </NewsDescription>

        <ExamplesSection>
          <ExamplesTitle>Quick Filter Examples</ExamplesTitle>
          <FilterExamplesGrid>
            <ExampleCard onClick={() => handleFilterClick(['lowEarthOrbit'])}>
              <ExampleLabel>Low Earth Orbit Satellites</ExampleLabel>
              <ExampleFilters>
                <Chip
                  icon={<LanguageIcon style={{ fontSize: '0.9rem' }} />}
                  label="LEO"
                  size="small"
                  color="success"
                  variant="filled"
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
              </ExampleFilters>
            </ExampleCard>

            <ExampleCard onClick={() => handleFilterClick(['sunSynchronousOrbit', 'recentTle'])}>
              <ExampleLabel>Recent Sun-Synchronous</ExampleLabel>
              <ExampleFilters>
                <Chip
                  icon={<WbSunnyIcon style={{ fontSize: '0.9rem' }} />}
                  label="Sun-Sync"
                  size="small"
                  color="warning"
                  variant="filled"
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
                <Chip
                  icon={<FiberNewIcon style={{ fontSize: '0.9rem' }} />}
                  label="Recent"
                  size="small"
                  color="warning"
                  variant="filled"
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
              </ExampleFilters>
            </ExampleCard>

            <ExampleCard onClick={() => handleFilterClick(['geostationaryOrbit'])}>
              <ExampleLabel>Geostationary Satellites</ExampleLabel>
              <ExampleFilters>
                <Chip
                  icon={<PublicIcon style={{ fontSize: '0.9rem' }} />}
                  label="Geostationary"
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
              </ExampleFilters>
            </ExampleCard>

            <ExampleCard onClick={() => handleFilterClick(['molniyaOrbit'])}>
              <ExampleLabel>Molniya Orbit Satellites</ExampleLabel>
              <ExampleFilters>
                <Chip
                  icon={<RocketLaunchIcon style={{ fontSize: '0.9rem' }} />}
                  label="Molniya"
                  size="small"
                  color="secondary"
                  variant="filled"
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
              </ExampleFilters>
            </ExampleCard>
          </FilterExamplesGrid>
        </ExamplesSection>
      </NewsContent>
    </NewsContainer>
  )
}

