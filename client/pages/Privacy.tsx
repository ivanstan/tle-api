import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styled from 'styled-components'
import { Container, Paper } from '@mui/material'

const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 40%, #162033 100%);
  padding: 48px 0;
`

const StyledPaper = styled(Paper)`
  && {
    padding: 48px;
    background: rgba(15, 22, 40, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
      padding: 24px;
    }
  }
`

const MarkdownContent = styled.div`
  color: rgba(255, 255, 255, 0.85);
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.7;

  h1 {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 2.5rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
    margin-top: 0;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  h2 {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 1.75rem;
    font-weight: 600;
    color: #4aa564;
    margin-top: 48px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid rgba(74, 165, 100, 0.2);
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
      margin-top: 32px;
    }
  }

  h3 {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    margin-top: 32px;
    margin-bottom: 12px;
  }

  p {
    margin: 16px 0;
    font-size: 1rem;
  }

  strong {
    color: #ffffff;
    font-weight: 600;
  }

  ul, ol {
    margin: 16px 0;
    padding-left: 24px;
  }

  li {
    margin: 8px 0;
  }

  a {
    color: #4aa564;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #74bd8c;
      text-decoration: underline;
    }
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #e8b866;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  blockquote {
    border-left: 4px solid #4aa564;
    padding-left: 16px;
    margin: 16px 0;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }
`

export const Privacy = () => {
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch('/PRIVACY.md')
      .then((response) => response.text())
      .then((text) => setContent(text))
      .catch((error) => console.error('Error loading privacy policy:', error))
  }, [])

  return (
    <PageWrapper>
      <Container maxWidth="md">
        <StyledPaper>
          <MarkdownContent>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </MarkdownContent>
        </StyledPaper>
      </Container>
    </PageWrapper>
  )
}

