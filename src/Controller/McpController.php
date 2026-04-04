<?php

namespace App\Controller;

use App\Repository\TleRepository;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/mcp')]
final class McpController extends AbstractApiController
{
    public function __construct(
        private readonly TleRepository $tleRepository
    ) {
    }

    /**
     * SSE endpoint: mcp-remote connects here via GET and receives a stream.
     * Server sends an "endpoint" event with the URL for the client to POST messages to.
     */
    #[Route('', name: 'mcp_sse', methods: ['GET'])]
    public function sse(Request $request): StreamedResponse
    {
        $sessionId = bin2hex(random_bytes(16));
        $endpointUrl = $request->getSchemeAndHttpHost() . '/mcp/message?sessionId=' . $sessionId;

        $response = new StreamedResponse(function () use ($sessionId, $endpointUrl) {
            // Clear any existing output buffers
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            @ini_set('max_execution_time', 0);
            @set_time_limit(0);

            // Send the endpoint event so mcp-remote knows where to POST
            echo "event: endpoint\n";
            echo "data: {$endpointUrl}\n\n";
            flush();

            $responseFile = sys_get_temp_dir() . '/mcp_' . $sessionId;
            $lastHeartbeat = time();

            while (!connection_aborted()) {
                // Check if a response has been written by the message handler
                if (file_exists($responseFile)) {
                    $data = file_get_contents($responseFile);
                    @unlink($responseFile);

                    echo "event: message\n";
                    echo "data: {$data}\n\n";
                    flush();
                }

                // Heartbeat every 15 seconds to keep connection alive
                if (time() - $lastHeartbeat >= 15) {
                    echo ": ping\n\n";
                    flush();
                    $lastHeartbeat = time();
                }

                usleep(100_000); // poll every 100ms
            }

            // Cleanup session file if client disconnected
            if (file_exists($responseFile)) {
                @unlink($responseFile);
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no'); // disable nginx buffering
        $response->headers->set('Access-Control-Allow-Origin', '*');

        return $response;
    }

    /**
     * Message endpoint: mcp-remote POSTs JSON-RPC messages here.
     * Response is written to a temp file which the SSE stream picks up.
     */
    #[Route('/message', name: 'mcp_message', methods: ['POST', 'OPTIONS'])]
    public function message(Request $request): Response
    {
        if ($request->getMethod() === 'OPTIONS') {
            return new Response('', Response::HTTP_OK, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type',
            ]);
        }

        $sessionId = $request->query->get('sessionId');
        $jsonRpc = json_decode($request->getContent(), true);

        if (!$jsonRpc || !isset($jsonRpc['method'])) {
            return new JsonResponse([
                'jsonrpc' => '2.0',
                'error' => ['code' => -32600, 'message' => 'Invalid Request'],
                'id' => null,
            ], Response::HTTP_BAD_REQUEST);
        }

        $method = $jsonRpc['method'];
        $params = $jsonRpc['params'] ?? [];
        $id = $jsonRpc['id'] ?? null;

        // Notifications don't need a response
        if (str_starts_with($method, 'notifications/')) {
            return new Response('', Response::HTTP_ACCEPTED, [
                'Access-Control-Allow-Origin' => '*',
            ]);
        }

        $result = match ($method) {
            'initialize' => $this->handleInitialize($params),
            'tools/list' => $this->handleToolsList(),
            'tools/call' => $this->handleToolCall($params),
            default => null
        };

        if ($result === null) {
            $payload = [
                'jsonrpc' => '2.0',
                'error' => ['code' => -32601, 'message' => 'Method not found'],
                'id' => $id,
            ];
        } else {
            $payload = [
                'jsonrpc' => '2.0',
                'result' => $result,
                'id' => $id,
            ];
        }

        // Write response to temp file for the SSE stream to pick up
        if ($sessionId) {
            file_put_contents(
                sys_get_temp_dir() . '/mcp_' . $sessionId,
                json_encode($payload)
            );

            return new Response('', Response::HTTP_ACCEPTED, [
                'Access-Control-Allow-Origin' => '*',
            ]);
        }

        // No session: return directly (fallback)
        return new JsonResponse($payload, Response::HTTP_OK, [
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    private function handleInitialize(array $params): array
    {
        return [
            'protocolVersion' => '2024-11-05',
            'capabilities' => [
                'tools' => [],
            ],
            'serverInfo' => [
                'name' => 'tle-satellite-server',
                'version' => '1.0.0',
            ],
        ];
    }

    private function handleToolsList(): array
    {
        return [
            'tools' => [
                [
                    'name' => 'search_satellites',
                    'description' => 'Search for satellites by name. Returns a list of satellites matching the search query with their TLE data.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'query' => [
                                'type' => 'string',
                                'description' => 'Search query (e.g. "ISS", "Hubble", "Starlink")',
                            ],
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Page number (default: 1)',
                                'default' => 1,
                            ],
                            'page_size' => [
                                'type' => 'integer',
                                'description' => 'Results per page (default: 10, max: 100)',
                                'default' => 10,
                            ],
                            'extra' => [
                                'type' => 'boolean',
                                'description' => 'Include extra orbital parameters (inclination, eccentricity, period, etc.)',
                                'default' => false,
                            ],
                        ],
                        'required' => ['query'],
                    ],
                ],
                [
                    'name' => 'get_satellite',
                    'description' => 'Get detailed information about a specific satellite by its NORAD catalog ID.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'satellite_id' => [
                                'type' => 'integer',
                                'description' => 'NORAD catalog ID (e.g. 25544 for ISS)',
                            ],
                            'extra' => [
                                'type' => 'boolean',
                                'description' => 'Include extra orbital parameters',
                                'default' => false,
                            ],
                        ],
                        'required' => ['satellite_id'],
                    ],
                ],
            ],
        ];
    }

    private function handleToolCall(array $params): array
    {
        $name = $params['name'] ?? null;
        $arguments = $params['arguments'] ?? [];

        return match ($name) {
            'search_satellites' => $this->toolSearchSatellites($arguments),
            'get_satellite' => $this->toolGetSatellite($arguments),
            default => [
                'content' => [['type' => 'text', 'text' => "Unknown tool: {$name}"]],
                'isError' => true,
            ],
        };
    }

    private function toolSearchSatellites(array $args): array
    {
        $query = $args['query'] ?? '';
        $page = (int) ($args['page'] ?? 1);
        $pageSize = min((int) ($args['page_size'] ?? 10), 100);
        $extra = (bool) ($args['extra'] ?? false);

        $builder = $this->tleRepository->collection($query, 'popularity', 'desc', []);
        $builder->setFirstResult(($page - 1) * $pageSize);
        $builder->setMaxResults($pageSize);

        $results = $builder->getQuery()->getResult();

        $satellites = [];
        foreach ($results as $tle) {
            $model = new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName());
            $satData = [
                'satelliteId' => $tle->getId(),
                'name' => $tle->getName(),
                'date' => $model->epochDateTime()->format(\DateTimeInterface::ATOM),
                'line1' => $tle->getLine1(),
                'line2' => $tle->getLine2(),
            ];

            if ($extra && $tle->getInfo()) {
                $info = $tle->getInfo();
                $satData['extra'] = [
                    'inclination' => $info->inclination,
                    'eccentricity' => $info->eccentricity,
                    'semi_major_axis' => $info->semiMajorAxis,
                    'period' => $info->period,
                    'raan' => $info->raan,
                ];
            }

            $satellites[] = $satData;
        }

        return [
            'content' => [[
                'type' => 'text',
                'text' => json_encode([
                    'total' => count($results),
                    'page' => $page,
                    'page_size' => $pageSize,
                    'satellites' => $satellites,
                ], JSON_PRETTY_PRINT),
            ]],
        ];
    }

    private function toolGetSatellite(array $args): array
    {
        $satelliteId = $args['satellite_id'] ?? null;
        $extra = (bool) ($args['extra'] ?? false);

        if (!$satelliteId) {
            return [
                'content' => [['type' => 'text', 'text' => '{"error": "satellite_id is required"}']],
                'isError' => true,
            ];
        }

        $tle = $this->tleRepository->find($satelliteId);

        if (!$tle) {
            return [
                'content' => [['type' => 'text', 'text' => json_encode(['error' => 'Satellite not found', 'satellite_id' => $satelliteId])]],
                'isError' => true,
            ];
        }

        $model = new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName());
        $satData = [
            'satelliteId' => $tle->getId(),
            'name' => $tle->getName(),
            'date' => $model->epochDateTime()->format(\DateTimeInterface::ATOM),
            'line1' => $tle->getLine1(),
            'line2' => $tle->getLine2(),
        ];

        if ($extra && $tle->getInfo()) {
            $info = $tle->getInfo();
            $satData['extra'] = [
                'inclination' => $info->inclination,
                'eccentricity' => $info->eccentricity,
                'semi_major_axis' => $info->semiMajorAxis,
                'period' => $info->period,
                'raan' => $info->raan,
            ];
        }

        return [
            'content' => [[
                'type' => 'text',
                'text' => json_encode($satData, JSON_PRETTY_PRINT),
            ]],
        ];
    }
}
