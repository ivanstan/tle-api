<?php

namespace App\Controller;

use App\Service\Traits\FileSystemAwareTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class DocsController extends AbstractController
{
    use FileSystemAwareTrait;

    #[Route("/", name: "tle_home")]
    #[Route('/api/tle/docs', name: "app_api_docs")]
    public function docs(): Response
    {
        return new Response(file_get_contents($this->getProjectDir() . '/public/index.html'));
    }

    /**
     * @throws \JsonException
     */
    #[Route("/api/tle.json", name: "app_api_docs_json")]
    public function getJson(): JsonResponse
    {
        $docs = json_decode(file_get_contents($this->getProjectDir() . '/etc/custom/tle.json'), true, flags: JSON_THROW_ON_ERROR);

        $docs['info']['version'] = $this->getParameter('version');

        return new JsonResponse($docs, Response::HTTP_OK, ['Access-Control-Allow-Origin' => '*']);
    }
}
