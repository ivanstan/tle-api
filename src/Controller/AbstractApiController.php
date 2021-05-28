<?php

namespace App\Controller;

use App\Service\Validator\RequestValidator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;

abstract class AbstractApiController extends AbstractController
{
    use RequestValidator;

    /** @var string ISO-8601 date format */
    public const DATETIME_FORMAT = 'c';

    protected const HYDRA_CONTEXT = 'https://www.w3.org/ns/hydra/context.jsonld';

    public const CORS_HEADERS = [
        'Content-type' => 'application/json',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Credentials' => 'true',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'DNT, X-User-Token, Keep-Alive, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control, Content-Type',
        'Access-Control-Max-Age' => 1728000,
    ];

    protected const SORT_PARAM = 'sort';
    protected const SORT_DIR_PARAM = 'sort-dir';
    protected const PAGE_SIZE_PARAM = 'page-size';
    protected const PAGE_PARAM = 'page';
    protected const PAGE_SIZE = 50;
    protected const SEARCH_PARAM = 'search';

    protected RouterInterface $router;

    /**
     * @required
     *
     * @param RouterInterface $router
     */
    public function setRouter(RouterInterface $router): void
    {
        $this->router = $router;
    }

    public function getPage(Request $request): int
    {
        return (int)$request->get(self::PAGE_PARAM, 1);
    }

    public function getPageOffset(int $page, int $pageSize): int
    {
        $offset = 0;
        if ($page > 1) {
            $offset = ($page - 1) * $pageSize;
        }

        return $offset;
    }

    public function getPagination(Request $request, int $total, int $pageSize): array
    {
        $params = $request->query->all();

        $page = $this->getPage($request);
        $pages = max(1, ceil($total / $pageSize));

        $nextPage = $page;
        if ($page < $pages) {
            $nextPage = $page + 1;
        }

        $previousPage = $page;
        if ($page > 1) {
            $previousPage = $page - 1;
        }

        $result = [
            '@id' => $this->router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $page]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            '@type' => 'PartialCollectionView',
            'first' => $this->router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => 1]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'previous' => $this->router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $previousPage]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'next' => $this->router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $nextPage]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
            'last' => $this->router->generate(
                $request->attributes->get('_route'),
                array_merge($params, ['page' => $pages]),
                UrlGeneratorInterface::ABSOLUTE_URL
            ),
        ];

        if ($page === 1) {
            unset($result['previous']);
        }

        if ($page === $nextPage) {
            unset($result['next']);
        }

        return $result;
    }

    public function response(array $data): JsonResponse
    {
        return new JsonResponse(
            $data,
            Response::HTTP_OK,
            self::CORS_HEADERS,
        );
    }
}
