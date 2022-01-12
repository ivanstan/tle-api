<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Contracts\Service\Attribute\Required;

abstract class AbstractApiController extends AbstractController
{
    protected const HYDRA_CONTEXT = 'https://www.w3.org/ns/hydra/context.jsonld';

    protected RouterInterface $router;

    #[Required]
    public function setRouter(RouterInterface $router): void
    {
        $this->router = $router;
    }

    public function response(array $data): JsonResponse
    {
        return new JsonResponse(
            $data,
            Response::HTTP_OK,
        );
    }
}
