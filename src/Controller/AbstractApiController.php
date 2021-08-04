<?php

namespace App\Controller;

use App\Service\DateTimeService;
use App\Service\Validator\RequestValidator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Contracts\Service\Attribute\Required;

abstract class AbstractApiController extends AbstractController
{
    use RequestValidator;

    protected const HYDRA_CONTEXT = 'https://www.w3.org/ns/hydra/context.jsonld';

    protected const SORT_PARAM = 'sort';
    protected const SORT_DIR_PARAM = 'sort-dir';
    protected const PAGE_SIZE_PARAM = 'page-size';
    protected const PAGE_PARAM = 'page';
    protected const PAGE_SIZE = 20;
    protected const SEARCH_PARAM = 'search';

    protected RouterInterface $router;

    #[Required]
    public function setRouter(RouterInterface $router): void
    {
        $this->router = $router;
    }

    public function getPage(Request $request): int
    {
        return (int)$request->get(self::PAGE_PARAM, 1);
    }

    public function getPageSize(Request $request, int $maxPageSize): int
    {
        return (int)min($request->get(self::PAGE_SIZE_PARAM, self::PAGE_SIZE), $maxPageSize);
    }

    public function response(array $data): JsonResponse
    {
        return new JsonResponse(
            $data,
            Response::HTTP_OK,
        );
    }

    protected function getDate(Request $request, string $name): \DateTime
    {
        $date = $request->get($name, DateTimeService::getCurrentUTC()->format(\DateTimeInterface::ATOM));

        return \DateTime::createFromFormat(\DateTimeInterface::ATOM, str_replace(' ', '+', $date));
    }
}
