import styled, { keyframes } from 'styled-components'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
`

const HeroSection = styled.div`
  padding: 80px 24px 60px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  animation: ${fadeInUp} 0.7s ease-out both;
`

const Badge = styled.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #4aa564;
  background: rgba(74, 165, 100, 0.12);
  border: 1px solid rgba(74, 165, 100, 0.3);
  border-radius: 100px;
  padding: 6px 16px;
  margin-bottom: 24px;
`

const Title = styled.h1`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 20px;
  letter-spacing: -0.02em;

  span {
    background: linear-gradient(135deg, #4aa564 0%, #74bd8c 50%, #35864d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const Subtitle = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: rgba(255, 255, 255, 0.65);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
`

const Content = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  gap: 64px;
`

const Section = styled.section<{ $delay?: number }>`
  animation: ${fadeInUp} 0.7s ease-out ${props => (props.$delay ?? 0) * 0.1}s both;
`

const SectionLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #4aa564;
  margin-bottom: 16px;

  &::before {
    content: '//';
    margin-right: 8px;
    opacity: 0.5;
  }
`

const SectionTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.3rem, 3vw, 1.75rem);
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 12px;
`

const SectionText = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.75;
  margin: 0 0 24px;
`

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 32px;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(74, 165, 100, 0.2);
  }
`

const ToolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const ToolCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ToolName = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4aa564;
  background: rgba(74, 165, 100, 0.1);
  border: 1px solid rgba(74, 165, 100, 0.2);
  border-radius: 8px;
  padding: 8px 14px;
  display: inline-block;
`

const ToolDesc = styled.p`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: 1.6;
`

const ParamList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ParamItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    background: #4aa564;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    top: -1px;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`

const ParamName = styled.code`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #74bd8c;
  background: rgba(74, 165, 100, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
  overflow-x: auto;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);

  .comment { color: rgba(255, 255, 255, 0.3); }
  .key { color: #74bd8c; }
  .string { color: #f0c674; }
  .number { color: #81a2be; }
`

const TabGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TabLabel = styled.div`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
`

const StepList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  counter-reset: steps;
`

const StepItem = styled.li`
  counter-increment: steps;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;

  &::before {
    content: counter(steps);
    min-width: 28px;
    height: 28px;
    background: rgba(74, 165, 100, 0.15);
    border: 1px solid rgba(74, 165, 100, 0.3);
    border-radius: 50%;
    color: #4aa564;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    color: #74bd8c;
    background: rgba(74, 165, 100, 0.1);
    padding: 2px 7px;
    border-radius: 4px;
  }

  strong {
    color: rgba(255, 255, 255, 0.9);
  }
`

const PromptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
`

const PromptCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(74, 165, 100, 0.07);
    border-color: rgba(74, 165, 100, 0.25);
  }
`

const PromptIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
`

const PromptText = styled.span`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  line-height: 1.5;
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin: 0;
`

const localJson = `{
  "mcpServers": {
    "tle-satellite": {
      "url": "http://localhost:8000/mcp",
      "transport": "http"
    }
  }
}`

const productionJson = `{
  "mcpServers": {
    "tle-satellite": {
      "url": "https://tle.ivanstanojevic.me/mcp",
      "transport": "http"
    }
  }
}`

const responseJson = `{
  "satelliteId": 25544,
  "name": "ISS (ZARYA)",
  "line1": "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9005",
  "line2": "2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456",
  "date": "2024-01-01T12:00:00+00:00",
  "extra": {
    "inclination": 51.64,
    "eccentricity": 0.0006317,
    "semi_major_axis": 6797.0,
    "period": 5558.0,
    "raan": 208.9163
  }
}`

export const Mcp = () => {
  return (
    <PageWrapper>
      <HeroSection>
        <Badge>Model Context Protocol</Badge>
        <Title>
          <span>MCP</span> Server
        </Title>
        <Subtitle>
          Connect AI assistants directly to live satellite orbital data.
          Query TLE data in natural language — no API keys, no wrappers.
        </Subtitle>
      </HeroSection>

      <Content>
        <Section $delay={1}>
          <SectionLabel>What is MCP</SectionLabel>
          <SectionTitle>AI-native satellite data access</SectionTitle>
          <SectionText>
            The Model Context Protocol (MCP) is an open standard that lets AI assistants like Cursor, Claude, 
            and others connect to external data sources through a common interface. Our MCP server exposes 
            the full TLE API to any compatible AI — so you can ask "find all Starlink satellites" and get 
            real orbital data back, right in your conversation.
          </SectionText>
          <SectionText>
            No installation required. The MCP endpoints run as part of the existing API at{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#74bd8c', fontSize: '0.85em' }}>
              tle.ivanstanojevic.me/mcp
            </code>
            .
          </SectionText>
        </Section>

        <Divider />

        <Section $delay={2}>
          <SectionLabel>Quick Start</SectionLabel>
          <SectionTitle>Configure in Cursor</SectionTitle>
          <SectionText>
            Add the TLE satellite server to your Cursor MCP settings in under a minute.
          </SectionText>

          <Card>
            <StepList>
              <StepItem>
                Open <strong>Cursor Settings</strong> and navigate to <strong>Features → MCP</strong>
              </StepItem>
              <StepItem>
                Click <strong>Add Server</strong> and paste the configuration below
              </StepItem>
              <StepItem>
                <strong>Restart Cursor</strong> — the TLE satellite tools will appear automatically
              </StepItem>
              <StepItem>
                Ask your AI assistant anything about satellites and it will use the live data
              </StepItem>
            </StepList>
          </Card>
        </Section>

        <Section $delay={3}>
          <SectionLabel>Configuration</SectionLabel>
          <SectionTitle>Setup</SectionTitle>

          <TabGroup>
            <div>
              <TabLabel>Production (recommended)</TabLabel>
              <CodeBlock>{productionJson}</CodeBlock>
            </div>
          </TabGroup>
        </Section>

        <Divider />

        <Section $delay={4}>
          <SectionLabel>Available Tools</SectionLabel>
          <SectionTitle>What your AI can do</SectionTitle>
          <SectionText>
            Two tools are exposed via MCP, covering search and retrieval of satellite TLE data.
          </SectionText>

          <ToolGrid>
            <ToolCard>
              <ToolName>search_satellites</ToolName>
              <ToolDesc>
                Search the database by satellite name. Returns matching satellites with TLE data 
                and optional extra orbital parameters.
              </ToolDesc>
              <ParamList>
                <ParamItem>
                  <ParamName>query</ParamName>
                  string — satellite name (e.g. "ISS", "Starlink", "Hubble")
                </ParamItem>
                <ParamItem>
                  <ParamName>page</ParamName>
                  integer — page number (default: 1)
                </ParamItem>
                <ParamItem>
                  <ParamName>page_size</ParamName>
                  integer — results per page, max 100 (default: 10)
                </ParamItem>
                <ParamItem>
                  <ParamName>extra</ParamName>
                  boolean — include extra orbital parameters (default: false)
                </ParamItem>
              </ParamList>
            </ToolCard>

            <ToolCard>
              <ToolName>get_satellite</ToolName>
              <ToolDesc>
                Retrieve detailed TLE data and orbital parameters for a specific satellite 
                by its NORAD catalog ID.
              </ToolDesc>
              <ParamList>
                <ParamItem>
                  <ParamName>satellite_id</ParamName>
                  integer — NORAD catalog ID (e.g. 25544 for ISS)
                </ParamItem>
                <ParamItem>
                  <ParamName>extra</ParamName>
                  boolean — include inclination, eccentricity, period, RAAN, and more
                </ParamItem>
              </ParamList>
            </ToolCard>
          </ToolGrid>
        </Section>

        <Section $delay={5}>
          <SectionLabel>Response Format</SectionLabel>
          <SectionTitle>TLE data structure</SectionTitle>
          <SectionText>
            All responses include standard TLE lines plus optional computed orbital parameters when{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#74bd8c', fontSize: '0.85em' }}>extra: true</code>.
          </SectionText>
          <CodeBlock>{responseJson}</CodeBlock>
        </Section>

        <Divider />

        <Section $delay={6}>
          <SectionLabel>Try It Out</SectionLabel>
          <SectionTitle>Example prompts for your AI</SectionTitle>
          <SectionText>
            Once configured, just ask your AI assistant in natural language:
          </SectionText>

          <PromptGrid>
            {[
              { icon: '🛰️', text: 'Search for ISS satellites and show me the TLE data' },
              { icon: '🌌', text: 'Find all Starlink satellites in the database' },
              { icon: '🔭', text: 'Get orbital data for the Hubble Space Telescope' },
              { icon: '📡', text: 'What is the inclination of satellite NORAD ID 25544?' },
              { icon: '🚀', text: 'Show me the TLE for satellite 20580 with extra parameters' },
              { icon: '🌍', text: 'Search for weather satellites and list their NORAD IDs' },
            ].map((p, i) => (
              <PromptCard key={i}>
                <PromptIcon>{p.icon}</PromptIcon>
                <PromptText>"{p.text}"</PromptText>
              </PromptCard>
            ))}
          </PromptGrid>
        </Section>

        <Divider />

        <Section $delay={7}>
          <SectionLabel>Troubleshooting</SectionLabel>
          <SectionTitle>Common issues</SectionTitle>

          <Card>
            <StepList>
              <StepItem>
                <span>
                  <strong>Cursor can't connect</strong> — verify the URL in your MCP settings 
                  matches the environment (production vs local). Restart Cursor after any changes.
                </span>
              </StepItem>
              <StepItem>
                <span>
                  <strong>Tools not showing up</strong> — open the MCP panel in Cursor settings 
                  to confirm the server status is <code>connected</code>.
                </span>
              </StepItem>
              <StepItem>
                <span>
                  <strong>Empty results</strong> — the TLE database is refreshed periodically 
                  from CelesTrak. If data looks stale, check the{' '}
                  <a href="#/health" style={{ color: '#4aa564', textDecoration: 'none' }}>health page</a>.
                </span>
              </StepItem>
            </StepList>
          </Card>
        </Section>
      </Content>
    </PageWrapper>
  )
}

export default Mcp
