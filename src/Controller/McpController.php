<?php

namespace App\Controller;

use App\Repository\TleRepository;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/mcp')]
final class McpController extends AbstractApiController
{
    public function __construct(
        private readonly TleRepository $tleRepository
    ) {
    }

    #[Route('/', name: 'mcp_protocol', methods: ['GET', 'POST', 'OPTIONS'])]
    public function handleMcpProtocol(Request $request): Response
    {
        // Handle OPTIONS for CORS
        if ($request->getMethod() === 'OPTIONS') {
            return new Response('', Response::HTTP_OK, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type'
            ]);
        }

        // Handle GET - return server info for discovery
        if ($request->getMethod() === 'GET') {
            $response = new JsonResponse([
                'name' => 'tle-satellite-server',
                'version' => '1.0.0',
                'protocolVersion' => '2024-11-05',
            ]);
            $response->headers->set('Access-Control-Allow-Origin', '*');
            return $response;
        }

        // Parse JSON-RPC request
        $jsonRpc = json_decode($request->getContent(), true);
        
        if (!$jsonRpc || !isset($jsonRpc['method'])) {
            return new JsonResponse([
                'jsonrpc' => '2.0',
                'error' => ['code' => -32600, 'message' => 'Invalid Request'],
                'id' => $jsonRpc['id'] ?? null
            ]);
        }

        $method = $jsonRpc['method'];
        $params = $jsonRpc['params'] ?? [];
        $id = $jsonRpc['id'] ?? null;

        // Handle MCP protocol methods
        $result = match($method) {
            'initialize' => $this->handleInitialize($params),
            'tools/list' => $this->handleToolsList(),
            'tools/call' => $this->handleToolCall($params),
            default => ['error' => ['code' => -32601, 'message' => 'Method not found']]
        };

        $response = new JsonResponse([
            'jsonrpc' => '2.0',
            'result' => $result,
            'id' => $id
        ]);

        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    private function handleInitialize(array $params): array
    {
        return [
            'protocolVersion' => '2024-11-05',
            'capabilities' => [
                'tools' => []
            ],
            'serverInfo' => [
                'name' => 'tle-satellite-server',
                'version' => '1.0.0'
            ]
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
                                'description' => 'Search query to find satellites (e.g., "ISS", "Hubble", "Starlink")'
                            ],
                            'page' => [
                                'type' => 'integer',
                                'description' => 'Page number for pagination (default: 1)',
                                'default' => 1
                            ],
                            'page_size' => [
                                'type' => 'integer',
                                'description' => 'Number of results per page (default: 10, max: 100)',
                                'default' => 10
                            ],
                            'extra' => [
                                'type' => 'boolean',
                                'description' => 'Include extra orbital parameters (inclination, eccentricity, period, etc.)',
                                'default' => false
                            ]
                        ],
                        'required' => ['query']
                    ]
                ],
                [
                    'name' => 'get_satellite',
                    'description' => 'Get detailed information about a specific satellite by its NORAD catalog ID. Returns TLE data and optional orbital parameters.',
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'satellite_id' => [
                                'type' => 'integer',
                                'description' => 'NORAD catalog ID of the satellite (e.g., 25544 for ISS)'
                            ],
                            'extra' => [
                                'type' => 'boolean',
                                'description' => 'Include extra orbital parameters (inclination, eccentricity, period, etc.)',
                                'default' => false
                            ]
                        ],
                        'required' => ['satellite_id']
                    ]
                ]
            ]
        ];
    }

    private function handleToolCall(array $params): array
    {
        $name = $params['name'] ?? null;
        $arguments = $params['arguments'] ?? [];

        if ($name === 'search_satellites') {
            return $this->toolSearchSatellites($arguments);
        } elseif ($name === 'get_satellite') {
            return $this->toolGetSatellite($arguments);
        }

        return ['error' => 'Unknown tool'];
    }

    private function toolSearchSatellites(array $args): array
    {
        $query = $args['query'] ?? '';
        $page = $args['page'] ?? 1;
        $pageSize = min($args['page_size'] ?? 10, 100);
        $extra = $args['extra'] ?? false;

        $builder = $this->tleRepository->collection($query, 'popularity', 'desc', []);
        $builder->setFirstResult(($page - 1) * $pageSize);
        $builder->setMaxResults($pageSize);

        $results = $builder->getQuery()->getResult();

        $satellites = [];
        foreach ($results as $tle) {
            $satData = [
                'satelliteId' => $tle->getId(),
                'name' => $tle->getName(),
                'line1' => $tle->getLine1(),
                'line2' => $tle->getLine2(),
                'date' => (new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName()))->epochDateTime()->format(\DateTimeInterface::ATOM),
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

        $data = [
            'total' => count($results),
            'page' => $page,
            'page_size' => $pageSize,
            'satellites' => $satellites
        ];

        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => json_encode($data, JSON_PRETTY_PRINT)
                ]
            ]
        ];
    }

    private function toolGetSatellite(array $args): array
    {
        $satelliteId = $args['satellite_id'] ?? null;
        $extra = $args['extra'] ?? false;

        if (!$satelliteId) {
            return [
                'content' => [
                    ['type' => 'text', 'text' => json_encode(['error' => 'satellite_id is required'])]
                ],
                'isError' => true
            ];
        }

        $tle = $this->tleRepository->find($satelliteId);

        if (!$tle) {
            return [
                'content' => [
                    ['type' => 'text', 'text' => json_encode(['error' => 'Satellite not found', 'satellite_id' => $satelliteId])]
                ],
                'isError' => true
            ];
        }

        $satData = [
            'satelliteId' => $tle->getId(),
            'name' => $tle->getName(),
            'line1' => $tle->getLine1(),
            'line2' => $tle->getLine2(),
            'date' => (new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName()))->epochDateTime()->format(\DateTimeInterface::ATOM),
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
            'content' => [
                [
                    'type' => 'text',
                    'text' => json_encode($satData, JSON_PRETTY_PRINT)
                ]
            ]
        ];
    }

    // Keep these endpoints for direct REST API access (optional)
    #[Route('/tools/search_satellites', name: 'mcp_search_satellites', methods: ['GET', 'POST', 'OPTIONS'])]
    public function searchSatellites(Request $request): Response
    {
        // Handle OPTIONS for CORS
        if ($request->getMethod() === 'OPTIONS') {
            return new Response('', Response::HTTP_OK, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type'
            ]);
        }

        // Handle GET with query parameters
        if ($request->getMethod() === 'GET') {
            $data = [
                'query' => $request->query->get('query', ''),
                'page' => (int) $request->query->get('page', 1),
                'page_size' => (int) $request->query->get('page_size', 10),
                'extra' => $request->query->get('extra', 'false') === 'true'
            ];
        } else {
            $data = json_decode($request->getContent(), true) ?? [];
        }
        $query = $data['query'] ?? '';
        $page = $data['page'] ?? 1;
        $pageSize = min($data['page_size'] ?? 10, 100);
        $extra = $data['extra'] ?? false;

        $builder = $this->tleRepository->collection($query, 'popularity', 'desc', []);
        $builder->setFirstResult(($page - 1) * $pageSize);
        $builder->setMaxResults($pageSize);

        $results = $builder->getQuery()->getResult();

        $satellites = [];
        foreach ($results as $tle) {
            $satData = [
                'satelliteId' => $tle->getId(),
                'name' => $tle->getName(),
                'line1' => $tle->getLine1(),
                'line2' => $tle->getLine2(),
                'date' => (new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName()))->epochDateTime()->format(\DateTimeInterface::ATOM),
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

        $response = $this->response([
            'total' => count($results),
            'page' => $page,
            'page_size' => $pageSize,
            'satellites' => $satellites
        ]);

        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    #[Route('/tools/get_satellite', name: 'mcp_get_satellite', methods: ['GET', 'POST', 'OPTIONS'])]
    public function getSatellite(Request $request): Response
    {
        // Handle OPTIONS for CORS
        if ($request->getMethod() === 'OPTIONS') {
            return new Response('', Response::HTTP_OK, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type'
            ]);
        }

        // Handle GET with query parameters
        if ($request->getMethod() === 'GET') {
            $data = [
                'satellite_id' => (int) $request->query->get('satellite_id'),
                'extra' => $request->query->get('extra', 'false') === 'true'
            ];
        } else {
            $data = json_decode($request->getContent(), true) ?? [];
        }
        $satelliteId = $data['satellite_id'] ?? null;
        $extra = $data['extra'] ?? false;

        if (!$satelliteId) {
            return new JsonResponse(['error' => 'satellite_id is required'], Response::HTTP_BAD_REQUEST);
        }

        $tle = $this->tleRepository->find($satelliteId);

        if (!$tle) {
            return new JsonResponse([
                'error' => 'Satellite not found',
                'satellite_id' => $satelliteId
            ], Response::HTTP_NOT_FOUND);
        }

        $satData = [
            'satelliteId' => $tle->getId(),
            'name' => $tle->getName(),
            'line1' => $tle->getLine1(),
            'line2' => $tle->getLine2(),
            'date' => (new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName()))->epochDateTime()->format(\DateTimeInterface::ATOM),
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

        $response = $this->response($satData);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

}
