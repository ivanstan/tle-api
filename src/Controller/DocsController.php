<?php

namespace App\Controller;

use App\Service\ApiDocService;
use Ivanstan\SymfonySupport\Traits\FileSystemAwareTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class DocsController extends AbstractController
{
    use FileSystemAwareTrait;

    public function __construct(private ApiDocService $service)
    {
    }

    #[Route('/', name: 'tle_home')]
    #[Route('/api/tle/docs', name: 'app_api_docs')]
    public function docs(): Response
    {
        return new Response(file_get_contents($this->getProjectDir().'/public/index.html'));
    }

    #[Route('/api/tle.json', name: 'app_api_docs_json')]
    public function getJson(): JsonResponse
    {
        return new JsonResponse($this->service->get('/etc/custom/tle.json'), Response::HTTP_OK, ['Access-Control-Allow-Origin' => '*']);
    }
}
