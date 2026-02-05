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

const privacyContent = `# Privacy Policy

**Last updated: February 5, 2026**

This Privacy Policy describes how TLE API ("we", "our", or "the Service") collects, uses, and protects information when you use the API available at:

https://tle.ivanstanojevic.me

By using the Service, you agree to the collection and use of information in accordance with this policy.

## 1. Overview

TLE API is a public, read-only service that provides access to satellite Two-Line Element (TLE) data. The API does not require user accounts and does not intentionally collect personal data.

However, like most internet services, some technical information is processed automatically to ensure reliability, security, and proper operation.

## 2. Information We Collect

### 2.1 Automatically Collected Information

When you access the API, the server may automatically log:

- IP address
- Date and time of request
- Requested endpoint and query parameters
- HTTP method and response status
- User-Agent header (browser, app, or client library type)
- Referring URL (if provided by your client)

This information is considered technical usage data and is used strictly for operational purposes.

### 2.2 Information We Do Not Collect

We do not:

- Require user registration
- Collect names, emails, or contact details through the API
- Track users across other websites
- Use cookies
- Store authentication credentials (there is no login system)

## 3. How We Use Information

Automatically collected technical data may be used to:

- Monitor API performance and stability
- Prevent abuse, spam, or denial-of-service attacks
- Debug errors and improve reliability
- Generate aggregated, anonymous usage statistics

We do not use this information for advertising or profiling.

## 4. Data Retention

Server logs may be stored for a limited period for operational and security purposes. Logs are automatically deleted or rotated after a reasonable retention period.

We do not maintain long-term user behavior profiles.

## 5. Data Sharing

We do not sell, trade, or rent data to third parties.

Information may only be disclosed:

- If required by law or legal process
- To protect the security and integrity of the Service
- To prevent abuse or malicious activity

Any shared information will be limited to what is strictly necessary.

## 6. Third-Party Services

The Service may be hosted using third-party infrastructure providers (such as cloud hosting platforms). These providers may process technical request data as part of normal server operation.

We do not share personal data with third parties for marketing or analytics.

## 7. Security

We take reasonable technical measures to protect the Service against unauthorized access, misuse, or disruption. However, no internet transmission or storage system can be guaranteed 100% secure.

## 8. Children's Privacy

This Service is intended for general technical and scientific use. We do not knowingly collect personal information from children.

## 9. Your Rights

Because we do not maintain user accounts or personal profiles, we generally cannot identify individual users in our logs.

If you believe your personal data has been processed inappropriately, you may contact us and we will review the request in accordance with applicable laws.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Updates will be reflected by changing the "Last updated" date at the top of this document.

Continued use of the Service after changes constitutes acceptance of the revised policy.

## 11. Contact

If you have questions about this Privacy Policy or the Service, you may contact:

**Ivan Stanojevic**  
Email: istanojevic@itekako.com  
Website: https://tle.ivanstanojevic.me
`

export const Privacy = () => {
  return (
    <PageWrapper>
      <Container maxWidth="md">
        <StyledPaper>
          <MarkdownContent>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {privacyContent}
            </ReactMarkdown>
          </MarkdownContent>
        </StyledPaper>
      </Container>
    </PageWrapper>
  )
}

