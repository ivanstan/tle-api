# TLE Satellite MCP Server

This MCP (Model Context Protocol) server provides tools for accessing satellite orbital data and TLE (Two-Line Element) information via HTTP.

## Installation

1. Install the MCP SDK dependency:
```bash
composer require mcp/sdk
```

2. The MCP server is integrated into your Symfony application as HTTP endpoints.

## Running the Server

The MCP server runs as part of your Symfony application on the `/mcp` route.

For local development:
```bash
php bin/console server:run
# or
symfony serve
```

## HTTP Endpoints

### Base URL
- **Local:** `http://localhost:8000/mcp`
- **Production:** `https://tle.ivanstanojevic.me/mcp`

### Available Endpoints

#### `GET /mcp`
Get server information and list of available tools.

#### `GET /mcp/tools`
Get detailed list of all available tools with their schemas.

#### `POST /mcp/call/{toolName}`
Call a specific tool directly.

**Example:**
```bash
curl -X POST http://localhost:8000/mcp/call/search_satellites \
  -H "Content-Type: application/json" \
  -d '{"query": "ISS", "extra": true}'
```

#### `POST /mcp`
Handle MCP protocol messages (for MCP clients).

## Configuring in Cursor

Add the following to your Cursor MCP settings:

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

For production:
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

**Parameters:**
- `query` (string, required): Search query (e.g., "ISS", "Hubble", "Starlink")
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Results per page (default: 10, max: 100)
- `extra` (boolean, optional): Include extra orbital parameters (default: false)

**Example:**
```json
{
  "query": "ISS",
  "extra": true
}
```

### 2. `get_satellite`
Get detailed information about a specific satellite by NORAD catalog ID.

**Parameters:**
- `satellite_id` (integer, required): NORAD catalog ID (e.g., 25544 for ISS)
- `extra` (boolean, optional): Include extra orbital parameters (default: false)

**Example:**
```json
{
  "satellite_id": 25544,
  "extra": true
}
```

### 3. `propagate_satellite`
Calculate satellite position and velocity at a specific time using SGP4/SDP4 propagation.

**Parameters:**
- `satellite_id` (integer, required): NORAD catalog ID
- `date` (string, optional): ISO 8601 date/time (defaults to current time)

**Example:**
```json
{
  "satellite_id": 25544,
  "date": "2024-01-15T12:00:00Z"
}
```

**Returns:**
- Geodetic coordinates (latitude, longitude, altitude)
- ECI position and velocity vectors
- Propagation algorithm used (SGP4 or SDP4)

### 4. `satellite_flyover`
Calculate upcoming satellite passes over a specific location.

**Parameters:**
- `satellite_id` (integer, required): NORAD catalog ID
- `latitude` (number, required): Observer latitude in degrees (-90 to 90)
- `longitude` (number, required): Observer longitude in degrees (-180 to 180)
- `only_visible` (boolean, optional): Return only visible passes (default: false)
- `date` (string, optional): Starting date/time in ISO 8601 format

**Example:**
```json
{
  "satellite_id": 25544,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "only_visible": true
}
```

**Returns:**
- Pass start/end times
- Maximum elevation and azimuth
- Visibility information

### 5. `popular_satellites`
Get the most popular satellites (top 12 most queried).

**Parameters:** None

**Example:**
```json
{}
```

### 6. `satellite_stats`
Get statistics about the satellite database.

**Parameters:** None

**Example:**
```json
{}
```

**Returns:**
- Total number of satellites
- Last update time
- Database metadata

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

The MCP server integrates with the TLE API backend:
- API Base URL: https://tle.ivanstanojevic.me
- Uses existing Symfony repositories and services
- Leverages Doctrine ORM for database access

## Development

The MCP server code is located at:
- Command: `src/Command/McpServerCommand.php`
- Service: `src/Service/TleMcpServer.php`

To add new tools, edit the `TleMcpServer` class and register additional tools in the `run()` method.

## License

GNU GPLv3 - Same as the main TLE API project
