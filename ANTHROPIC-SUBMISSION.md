# Anthropic MCP Directory Submission Guide

## ⚠️ IMPORTANT: Use the CORRECT Form!

You have a **REMOTE MCP Server** (not a desktop extension).

### ✅ Correct Form:
**Remote MCP Server Submission**: https://docs.google.com/forms/d/e/1FAIpQLSeafJF2NDI7oYx1r8o0ycivCSVLNq92Mpc1FPxMKSw1CzDkqA/viewform

### ❌ Wrong Form (Don't Use):
Desktop Extensions Form - This is for .mcpb files only

---

## 📋 Your Submission Information

Copy and paste the answers below into the correct form.

### Basic Information

**Primary Contact Name:**
```
Ivan Stanojević
```

**Primary Contact Email:**
```
ivanstan@gmail.com
```

**Is this an update to an existing server?**
```
No
```

---

### Server Details

**Server Name:**
```
TLE Satellite Tracker
```

**Server URL:**
```
https://tle.ivanstanojevic.me/mcp
```

**Tagline (brief, catchy description):**
```
Real-time satellite orbital data for ISS, Starlink, Hubble, and thousands more
```

**Server Description (50 words max):**
```
Provides TLE (Two-Line Element) data and orbital parameters for satellite tracking. Search by name or NORAD ID to get real-time position, velocity, and orbital characteristics. Includes historical data updated daily from Space-Track.org. Perfect for space research, education, and satellite tracking applications.
```

---

### Technical Configuration

**Transport Protocol:**
```
SSE (Server-Sent Events)
```

**Authentication Type:**
```
None (public API, no authentication required)
```

**OAuth Required:**
```
No
```

**Server Capabilities:**
```
Tools only
```

**Connection Requirements:**
```
Internet access only - no authentication, firewall, or special configuration needed
```

---

### Tools Documentation

**List all tools with complete details:**

#### Tool 1: search_satellites

- **Name**: search_satellites
- **Description**: Search for satellites by name or identifier. Returns a paginated list of matching satellites with their TLE data and metadata.
- **Safety Annotation**: readOnlyHint: true
- **Parameters**:
  - `query` (string, required): Search term (e.g., "ISS", "Hubble", "Starlink")
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `page_size` (integer, optional): Results per page, max 100 (default: 10)
  - `extra` (boolean, optional): Include extra orbital parameters (default: false)

#### Tool 2: get_satellite

- **Name**: get_satellite
- **Description**: Get detailed information about a specific satellite using its NORAD catalog ID. Returns TLE data, epoch date, and optional orbital parameters.
- **Safety Annotation**: readOnlyHint: true
- **Parameters**:
  - `satellite_id` (integer, required): NORAD catalog ID (e.g., 25544 for ISS)
  - `extra` (boolean, optional): Include orbital parameters like inclination, eccentricity, semi-major axis, period, and RAAN (default: false)

---

### Usage Examples (Minimum 3 Required)

#### Example 1: Find the International Space Station

**User prompt:**
```
"Search for ISS satellites"
```

**What happens:**
- Server searches the satellite database for "ISS"
- Returns ISS (ZARYA) with NORAD ID 25544
- Provides TLE data (line1, line2) and epoch date
- Shows when the orbital data was last updated

**Expected result:**
User receives current TLE data for the ISS suitable for orbital calculations and tracking.

---

#### Example 2: Get detailed orbital parameters for a satellite

**User prompt:**
```
"Get satellite 25544 with extra orbital parameters"
```

**What happens:**
- Server retrieves satellite with NORAD ID 25544 (ISS)
- Returns complete TLE data
- Includes extra orbital parameters:
  - Inclination: 51.6° (orbital tilt)
  - Eccentricity: 0.001 (nearly circular orbit)
  - Semi-major axis: ~6,800 km
  - Period: ~93 minutes per orbit
  - RAAN: Right Ascension of Ascending Node

**Expected result:**
User gets comprehensive orbital mechanics data useful for trajectory analysis and propagation.

---

#### Example 3: Search for Starlink constellation satellites

**User prompt:**
```
"Find Starlink satellites and show me the first 5 results"
```

**What happens:**
- Server searches for "Starlink" in satellite names
- Returns paginated results (5 satellites)
- Each result includes satellite name, NORAD ID, TLE data, and epoch
- Data can be used for constellation tracking

**Expected result:**
User receives a list of Starlink satellites with orbital data for tracking the megaconstellation.

---

### Documentation and Policies

**GitHub Repository:**
```
https://github.com/ivanstan/tle-api
```

**Main Documentation URL:**
```
https://github.com/ivanstan/tle-api#readme
```

**MCP Quick Start Guide:**
```
https://github.com/ivanstan/tle-api/blob/master/MCP-QUICKSTART.md
```

**MCP Server Documentation:**
```
https://github.com/ivanstan/tle-api/blob/master/MCP-SERVER.md
```

**Privacy Policy URL:**
```
https://tle.ivanstanojevic.me/privacy
```
(Served from PRIVACY.md in repository)

**Terms of Service:**
```
Open source under GPLv3 license
https://github.com/ivanstan/tle-api/blob/master/LICENSE.md
```

---

### Support Channels

**Email Support:**
```
ivanstan@gmail.com
```

**GitHub Issues:**
```
https://github.com/ivanstan/tle-api/issues
```

**Response Time:**
```
Typically within 24-48 hours for support requests
```

---

### Data Handling Practices

**What data does your server collect?**
```
Server logs standard technical data only:
- IP addresses (for rate limiting and abuse prevention)
- Request timestamps
- Requested endpoints and query parameters
- HTTP method and response status
- User-Agent headers

No personal data, authentication credentials, or conversation content is collected or stored.
```

**How is data used?**
```
Technical data is used solely for:
- Monitoring API performance and uptime
- Preventing abuse and DDoS attacks
- Debugging errors and improving reliability
- Generating anonymous usage statistics

Data is not used for advertising, profiling, or marketing.
```

**Data retention:**
```
Server logs are rotated and deleted automatically after 30 days.
No long-term user behavior profiles are maintained.
```

**Third-party connections:**
```
None. Server uses locally cached satellite data that is updated daily from Space-Track.org.
MCP interactions do not connect to any third-party services.
```

**Data sharing:**
```
No data is sold, traded, or shared with third parties.
Data may only be disclosed if required by law or to prevent abuse.
```

---

### Production Readiness

**Is your server production-ready (GA status)?**
```
Yes
```

**Production details:**
```
- Server has been in production since 2021
- Available 24/7 at tle.ivanstanojevic.me
- Daily data updates from Space-Track.org
- Stable API with documented endpoints
- Monitoring and logging in place
- No beta or experimental features
```

**Uptime and reliability:**
```
- Hosted on reliable infrastructure
- Daily automated updates
- Error handling and graceful degradation
- Rate limiting to prevent abuse
```

---

### Test Account

**Is a test account required?**
```
No - Server is publicly accessible without authentication
```

**How to test:**
```
Users can test immediately by:
1. Adding the server to their MCP client
2. Making requests through natural language prompts
3. No registration or API keys needed

Example test:
"Search for ISS satellites" or "Get satellite 25544 with orbital parameters"
```

---

### Server Assets

**Server Logo/Icon:**
```
TODO: Create a 512x512px icon representing satellite tracking
Suggested design: Satellite icon with orbital path on dark background
```

**Promotional Images:**
```
Optional - Screenshots of the MCP server in action showing:
- Search results for popular satellites
- Detailed orbital parameters display
- Example prompts and responses
```

---

### Primary Party Confirmation

**Do you work for the company that owns the application/service?**
```
Yes - This is my personal satellite tracking API that I built and maintain
```

---

### Compliance

**Do you agree to the MCP Directory Terms & Conditions?**
```
Yes - I have read and agree to the Anthropic MCP Directory Terms and Conditions
https://support.claude.com/en/articles/11697081-anthropic-mcp-directory-terms-and-conditions
```

**MCP Directory Policy compliance:**
```
Yes - Server complies with Anthropic MCP Directory Policy
https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy

Specifically:
- All tools have proper readOnlyHint annotations
- Server is production-ready and stable
- Privacy policy is published and accessible
- No malicious or harmful functionality
- No data collection beyond necessary technical logs
```

---

### Additional Feedback

**Optional feedback for Anthropic:**
```
The MCP protocol makes satellite tracking data accessible through natural language,
which significantly lowers the barrier for space education and research. This server
demonstrates how scientific data APIs can benefit from MCP integration.

Current capabilities include basic search and retrieval, but potential future
enhancements could include:
- Satellite pass predictions for ground locations
- Orbital propagation calculations
- Conjunction analysis for satellite collisions
- Historical TLE data queries

Looking forward to making space data more accessible through Claude and other
MCP-compatible clients!
```

---

## ✅ Pre-Submission Checklist

Before submitting, verify:

- [x] All tools have readOnlyHint annotations
- [x] Server accessible via HTTPS with valid certificate
- [x] Comprehensive documentation published on GitHub
- [x] Privacy policy published and accessible
- [x] Support channels documented (email + GitHub issues)
- [x] Server is production-ready (GA status)
- [x] Minimum 3 usage examples documented
- [x] No authentication required (public API)
- [x] Error handling implemented
- [x] MCP server published to official registry

---

## 📝 Next Steps

1. **Review all information above**
2. **Create server logo** (512x512px recommended)
3. **Deploy latest code** (with privacy policy)
4. **Fill out the form**: https://docs.google.com/forms/d/e/1FAIpQLSeafJF2NDI7oYx1r8o0ycivCSVLNq92Mpc1FPxMKSw1CzDkqA/viewform
5. **Wait for review** (typical review time: ~2 weeks)

---

## 📞 Questions?

- **MCP Protocol**: https://modelcontextprotocol.io/
- **Submission Guide**: https://support.claude.com/en/articles/12922490
- **Directory Policy**: https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy

Good luck with your submission! 🛰️
