<?php

namespace App\Controller;

use App\Repository\TleRepository;
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

    #[Route('/', name: 'mcp_info', methods: ['GET'])]
    public function info(): Response
    {
        return $this->response([
            'name' => 'tle-satellite-server',
            'version' => '1.0.0',
            'description' => 'MCP server providing satellite orbital data and TLE information',
            'protocol_version' => '2025-03-26',
            'base_url' => 'https://tle.ivanstanojevic.me/mcp',
            'tools' => [
                [
                    'name' => 'search_satellites',
                    'description' => 'Search for satellites by name',
                    'endpoint' => '/mcp/tools/search_satellites'
                ],
                [
                    'name' => 'get_satellite',
                    'description' => 'Get satellite by NORAD ID',
                    'endpoint' => '/mcp/tools/get_satellite'
                ]
            ]
        ]);
    }

    #[Route('/tools/search_satellites', name: 'mcp_search_satellites', methods: ['POST'])]
    public function searchSatellites(Request $request): Response
    {
        $data = json_decode($request->getContent(), true) ?? [];
        
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

        return $this->response([
            'total' => count($results),
            'page' => $page,
            'page_size' => $pageSize,
            'satellites' => $satellites
        ]);
    }

    #[Route('/tools/get_satellite', name: 'mcp_get_satellite', methods: ['POST'])]
    public function getSatellite(Request $request): Response
    {
        $data = json_decode($request->getContent(), true) ?? [];
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

        return $this->response($satData);
    }

}
