<?php

namespace App\Controller;

use App\Service\Traits\FileSystemAwareTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ApiController extends AbstractController
{
    use FileSystemAwareTrait;

    /**
     * @Route("/", name="app_api_docs")
     */
    public function docs(): Response
    {
        return $this->render('docs.html.twig');
    }

    /**
     * @Route("/api/{name}.json", name="app_api_docs_json")
     */
    public function getJson(string $name): JsonResponse
    {
        $path = $this->getProjectDir() . '/config/custom/' . $name . '.json';

        $file = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        return new JsonResponse($file, Response::HTTP_OK, ['Access-Control-Allow-Origin' => '*',]);
    }
}
