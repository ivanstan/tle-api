# Publishing the TLE Satellite MCP Server

This document describes how to publish the TLE Satellite MCP server to public directories.

## Option 1: Official MCP Registry (Recommended)

The MCP Registry makes your server discoverable to all MCP-compatible clients (Cursor, Claude Desktop, Zed, etc.).

### Prerequisites

- Domain: `ivanstanojevic.me` (owned and controlled)
- GitHub account: `ivanstan`
- Server URL: `https://tle.ivanstanojevic.me/mcp`

### Publishing Steps

1. **Install MCP Publisher CLI**

   ```bash
   # Linux/macOS
   curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
   
   # Windows (PowerShell)
   $arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
   Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
   tar xf mcp-publisher.tar.gz mcp-publisher.exe
   # Move mcp-publisher.exe to a directory in your PATH
   ```

2. **Set up DNS Authentication**

   Add a TXT record to your DNS for `ivanstanojevic.me`:

   ```
   Name: _mcp-registry.ivanstanojevic.me
   Type: TXT
   Value: github:ivanstan
   ```

   This links your domain to your GitHub account for namespace verification.

3. **Authenticate with the MCP Registry**

   ```bash
   mcp-publisher login dns
   ```

   When prompted, enter your domain: `ivanstanojevic.me`

4. **Verify server.json**

   The `server.json` file is already configured in the repository root. Review it if needed.

5. **Publish to the Registry**

   ```bash
   mcp-publisher publish
   ```

6. **Verify Publication**

   ```bash
   curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=tle-satellite"
   ```

   You should see your server in the search results.

### Updating Published Server

When you make changes:

1. Update the `version` field in `server.json`
2. Deploy changes to production
3. Run `mcp-publisher publish` again

---

## Option 2: Anthropic's Claude Connectors Directory

This makes your server specifically discoverable to Claude users in the Anthropic ecosystem.

### Submit via Web Form

**URL**: https://clau.de/mcp-directory-submission

### Required Information

**Server Details:**
- Server Name: TLE Satellite Tracker
- Server URL: `https://tle.ivanstanojevic.me/mcp`
- Tagline: Access satellite orbital data and TLE information
- Description: Provides real-time satellite tracking data, TLE information, and orbital parameters for thousands of satellites including ISS, Starlink, Hubble, and more.

**Technical Configuration:**
- Transport Protocol: SSE (Server-Sent Events)
- Authentication Type: None (public API)
- Capabilities: Tools only
- Connection Requirements: Internet access

**Tools:**
1. `search_satellites`
   - Description: Search for satellites by name
   - Annotation: `readOnlyHint: true`
   - Parameters: query (required), page, page_size, extra

2. `get_satellite`
   - Description: Get satellite details by NORAD ID
   - Annotation: `readOnlyHint: true`
   - Parameters: satellite_id (required), extra

**Data Handling:**
- No personal data collected
- No third-party services used for data storage
- Public satellite orbital data from Space-Track.org
- No authentication required

**Documentation:**
- Repository: https://github.com/ivanstan/tle-api
- README: https://github.com/ivanstan/tle-api#readme
- MCP Quick Start: [Link to MCP-QUICKSTART.md]
- Privacy Policy: [Add privacy policy to README]

**Assets:**
- Server logo (512x512px recommended)
- Favicon (optional)
- Promotional images (optional)

**Test Instructions:**
No test account needed - the API is publicly accessible. Example queries:
1. Search for ISS: `search_satellites` with query "ISS"
2. Get ISS details: `get_satellite` with satellite_id 25544

### Review Timeline

Typical review time: 2 weeks

---

## Marketing & Promotion

Once published, consider:

1. **Announce on Social Media**
   - Twitter/X
   - Reddit (r/cursor, r/ClaudeAI, r/space)
   - Hacker News

2. **Blog Post**
   - Write about building an MCP server
   - Share technical insights
   - Use cases for satellite tracking

3. **GitHub**
   - Add MCP badge to README
   - Update description to mention MCP support
   - Add to GitHub topics: `mcp`, `model-context-protocol`, `cursor`, `claude`

4. **Community**
   - Share in Cursor Discord
   - Post in MCP community forums
   - Contribute to MCP documentation with examples

---

## Resources

- MCP Registry: https://modelcontextprotocol.io/registry
- MCP Registry GitHub: https://github.com/modelcontextprotocol/registry
- MCP Documentation: https://modelcontextprotocol.io/
- Anthropic Connectors: https://claude.com/connectors
- This Project: https://github.com/ivanstan/tle-api
