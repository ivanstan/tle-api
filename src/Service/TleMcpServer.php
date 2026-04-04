<?php

namespace App\Service;

use App\Repository\TleRepository;
use Mcp\Server\Server;
use Mcp\Types\Tool;
use Mcp\Types\Content\TextContent;

final class TleMcpServer
{
    private Server $server;

    public function __construct(
        private readonly TleRepository $tleRepository,
        private readonly FlyOverService $flyOverService,
        private readonly string $apiBaseUrl = 'https://tle.ivanstanojevic.me'
    ) {
        $this->initializeServer();
    }

    private function initializeServer(): void
    {
        $this->server = new Server(
            name: 'tle-satellite-server',
            version: '1.0.0'
        );

        // Register tools
        $this->registerSearchSatellitesTool($this->server);
        $this->registerGetSatelliteTool($this->server);
    }

    public function getServer(): Server
    {
        return $this->server;
    }

    private function registerSearchSatellitesTool(Server $server): void
    {
        $server->addTool(
            new Tool(
                name: 'search_satellites',
                description: 'Search for satellites by name. Returns a list of satellites matching the search query with their TLE data.',
                inputSchema: [
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
            ),
            function (array $args): array {
                $query = $args['query'] ?? '';
                $page = $args['page'] ?? 1;
                $pageSize = min($args['page_size'] ?? 10, 100);
                $extra = $args['extra'] ?? false;

                $builder = $this->tleRepository->collection($query, 'popularity', 'desc', []);
                $builder->setFirstResult(($page - 1) * $pageSize);
                $builder->setMaxResults($pageSize);

                $results = $builder->getQuery()->getResult();
                $total = count($builder->getQuery()->getResult());

                $satellites = [];
                foreach ($results as $tle) {
                    $satData = [
                        'satelliteId' => $tle->getId(),
                        'name' => $tle->getName(),
                        'line1' => $tle->getLine1(),
                        'line2' => $tle->getLine2(),
                        'date' => $tle->getUpdatedAt()->format(\DateTimeInterface::ATOM),
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

                $response = json_encode([
                    'total' => $total,
                    'page' => $page,
                    'page_size' => $pageSize,
                    'satellites' => $satellites
                ], JSON_PRETTY_PRINT);

                return [new TextContent(text: $response)];
            }
        );
    }

    private function registerGetSatelliteTool(Server $server): void
    {
        $server->addTool(
            new Tool(
                name: 'get_satellite',
                description: 'Get detailed information about a specific satellite by its NORAD catalog ID. Returns TLE data and optional orbital parameters.',
                inputSchema: [
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
            ),
            function (array $args): array {
                $satelliteId = $args['satellite_id'];
                $extra = $args['extra'] ?? false;

                $tle = $this->tleRepository->find($satelliteId);

                if (!$tle) {
                    $response = json_encode([
                        'error' => 'Satellite not found',
                        'satellite_id' => $satelliteId
                    ], JSON_PRETTY_PRINT);
                    return [new TextContent(text: $response)];
                }

                $satData = [
                    'satelliteId' => $tle->getId(),
                    'name' => $tle->getName(),
                    'line1' => $tle->getLine1(),
                    'line2' => $tle->getLine2(),
                    'date' => $tle->getUpdatedAt()->format(\DateTimeInterface::ATOM),
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

                $response = json_encode($satData, JSON_PRETTY_PRINT);
                return [new TextContent(text: $response)];
            }
        );
    }
}
