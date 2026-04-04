<?php

namespace App\Controller;

use App\Service\TleMcpServer;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/mcp')]
final class McpController extends AbstractApiController
{
    public function __construct(
        private readonly TleMcpServer $mcpServer
    ) {
    }

    #[Route('/', name: 'mcp_info', methods: ['GET'])]
    public function info(): Response
    {
        return $this->response([
            'name' => 'tle-satellite-server',
            'version' => '1.0.0',
            'description' => 'MCP server providing satellite orbital data and TLE information',
            'protocol_version' => '2025-03-26',
            'endpoints' => [
                'http_server' => 'Use bin/mcp-http-server to start standalone MCP HTTP server',
                'info' => 'GET /mcp - This endpoint',
            ],
            'tools' => [
                'search_satellites' => 'Search for satellites by name',
                'get_satellite' => 'Get satellite by NORAD ID',
                'propagate_satellite' => 'Calculate satellite position at specific time',
                'satellite_flyover' => 'Calculate satellite passes over location',
                'popular_satellites' => 'Get most popular satellites',
                'satellite_stats' => 'Get database statistics'
            ],
            'usage' => 'Run: php bin/mcp-http-server to start MCP HTTP server on port 3000'
        ]);
    }
}
