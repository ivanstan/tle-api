# MCP Server Quick Start

## Installation

The MCP endpoints are already part of your Symfony application. No additional setup needed!

## Configure in Cursor

1. Open Cursor Settings
2. Go to **Features** → **MCP**
3. Add server configuration:

**For local development:**
```json
{
  "tle-satellite": {
    "url": "http://localhost:8000/mcp",
    "transport": "http"
  }
}
```

**For production (recommended):**
```json
{
  "tle-satellite": {
    "url": "https://tle.ivanstanojevic.me/mcp",
    "transport": "http"
  }
}
```

4. Restart Cursor

## Try It Out

Ask Cursor AI:

- "Search for ISS satellites using the TLE MCP server"
- "Get detailed information for satellite 25544 with extra orbital parameters"
- "Find all Starlink satellites"
- "Search for Hubble in the satellite database"

That's it! The AI will now have access to your satellite database with TLE orbital data.

## Troubleshooting

### Cursor can't connect
- Ensure your Symfony app is running (locally or on tle.ivanstanojevic.me)
- Check the URL in Cursor settings matches your environment
- Restart Cursor after configuration changes

### Tools not working
- Test the endpoints directly with curl first
- Check Symfony logs for errors
- Verify database connection in your Symfony app
- Ensure TLE data is imported (run `php bin/console tle:import`)

## Next Steps

- Read [MCP-SERVER.md](MCP-SERVER.md) for complete documentation
- Add custom tools by editing `src/Service/TleMcpServer.php`
- Deploy to production with systemd or PM2
