# TLE Satellite MCP Server

This MCP (Model Context Protocol) server provides tools for accessing satellite orbital data and TLE (Two-Line Element) information via HTTP.

## Features

- 🛰️ **Search Satellites** - Find satellites by name with TLE data
- 📡 **Get Satellite** - Retrieve detailed TLE and orbital parameters by NORAD ID

## Installation

No additional installation required! The MCP endpoints are standard Symfony routes that work through your existing web server.

## Running the Server

The MCP server runs as part of your existing Symfony application through regular HTTP endpoints. No separate server process is needed!

### Local Development

```bash
# Start your Symfony development server
php bin/console server:run
# or
symfony serve
```

The MCP endpoints will be available at `http://localhost:8000/mcp`

### Production (tle.ivanstanojevic.me)

The MCP endpoints are served through your existing web server (Apache/Nginx) at `https://tle.ivanstanojevic.me/mcp`.

No additional configuration needed! Just deploy your code as usual with `composer deploy`.

## Configuring in Cursor

Add the following to your Cursor MCP settings (Settings → Features → MCP):

**For local development:**
```json
{
  "mcpServers": {
    "tle-satellite": {
      "url": "http://localhost:8000/mcp",
      "transport": "http"
    }
  }
}
```

**For production (recommended):**
```json
{
  "mcpServers": {
    "tle-satellite": {
      "url": "https://tle.ivanstanojevic.me/mcp",
      "transport": "http"
    }
  }
}
```

## Available Tools

### 1. `search_satellites`
Search for satellites by name.

**Endpoint:** `POST /mcp/tools/search_satellites`

**Parameters:**
- `query` (string, required): Search query (e.g., "ISS", "Hubble", "Starlink")
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Results per page (default: 10, max: 100)
- `extra` (boolean, optional): Include extra orbital parameters (default: false)

**Example:**
```bash
curl -X POST https://tle.ivanstanojevic.me/mcp/tools/search_satellites \
  -H "Content-Type: application/json" \
  -d '{"query": "ISS", "extra": true}'
```

### 2. `get_satellite`
Get detailed information about a specific satellite by NORAD catalog ID.

**Endpoint:** `POST /mcp/tools/get_satellite`

**Parameters:**
- `satellite_id` (integer, required): NORAD catalog ID (e.g., 25544 for ISS)
- `extra` (boolean, optional): Include extra orbital parameters (default: false)

**Example:**
```bash
curl -X POST https://tle.ivanstanojevic.me/mcp/tools/get_satellite \
  -H "Content-Type: application/json" \
  -d '{"satellite_id": 25544, "extra": true}'
```

## TLE Data Format

All satellite data includes TLE (Two-Line Element) information:

```json
{
  "satelliteId": 25544,
  "name": "ISS (ZARYA)",
  "line1": "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9005",
  "line2": "2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456",
  "date": "2024-01-01T12:00:00+00:00"
}
```

When `extra: true` is specified, additional orbital parameters are included:

```json
{
  "extra": {
    "inclination": 51.64,
    "eccentricity": 0.0006317,
    "semi_major_axis": 6797.0,
    "period": 5558.0,
    "raan": 208.9163
  }
}
```

## API Integration

The MCP server integrates with your existing Symfony infrastructure:
- Uses existing `TleRepository` and `FlyOverService`
- Leverages Doctrine ORM for direct database access
- Falls back to HTTP API for propagate/flyover calculations
- Shares the same codebase and database as the main API

## Development

The MCP server code is located at:
- HTTP Server Script: `bin/mcp-http-server`
- Service: `src/Service/TleMcpServer.php`
- Controller: `src/Controller/McpController.php` (info endpoint only)

To add new tools:
1. Edit `src/Service/TleMcpServer.php`
2. Add a new `register{ToolName}Tool()` method
3. Call it from `initializeServer()`
4. Each tool must return an array with a `content` key containing text content

## Testing

### 1. Check MCP info endpoint:
```bash
curl https://tle.ivanstanojevic.me/mcp
```

### 2. Test searching for satellites:
```bash
curl -X POST https://tle.ivanstanojevic.me/mcp/tools/search_satellites \
  -H "Content-Type: application/json" \
  -d '{"query": "ISS", "extra": true}'
```

### 3. Get a specific satellite:
```bash
curl -X POST https://tle.ivanstanojevic.me/mcp/tools/get_satellite \
  -H "Content-Type: application/json" \
  -d '{"satellite_id": 25544, "extra": true}'
```

### 4. Example Usage in Cursor

Once configured, you can use natural language queries:

- "Search for ISS satellites using the TLE MCP"
- "Get orbital data for satellite 25544 with extra parameters"
- "Find all Starlink satellites"
- "Show me details for NORAD ID 25544"

The AI assistant will automatically use the appropriate MCP tools to fetch real-time satellite data from your database.

## License

GNU GPLv3 - Same as the main TLE API project
