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
     * @Route("/api/{name}/docs", name="app_api_docs")
     */
    public function html(string $name): Response
    {
        return $this->render('pages/api/docs.html.twig', ['name' => $name]);
    }

    /**
     * @Route("/api/{name}/json", name="app_api_docs_json")
     */
    public function getJson(string $name): JsonResponse
    {
        $file = json_decode(file_get_contents($this->getProjectDir().'/config/custom/'.$name.'.json'), true);

        switch ($name) {
            case 'tle':
                $file['info']['title'] = 'TLE API';
                $file['info']['version'] = '1.3.0';
                break;
        }

        return new JsonResponse($file);
    }
}
