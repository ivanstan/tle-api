<?php

namespace App\Controller\Api;

use App\Entity\Tle;
use App\Repository\TleRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * @Route("/api/tle")
 */
class TleController extends AbstractApiController
{
    protected const MAX_PAGE_SIZE = 100;

    protected const PAGE_SIZE = 20;

    /**
     * @Route("/{id}", name="tle_record", requirements={"id"="\d+"})
     */
    public function record(int $id, TleRepository $repository): Response
    {
        /** @var Tle $tle */
        $tle = $repository->findOneBy(['id' => $id]);

        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $id));
        }

        return $this->response($tle);
    }

    /**
     * @Route(name="tle_collection")
     */
    public function collection(Request $request, TleRepository $repository): Response
    {
        $search = $request->get(self::SEARCH_PARAM);
        $sort = $this->getSort($request, TleRepository::SORT_NAME, TleRepository::$sort);
        $sortDir = $this->getSortDirection($request, self::SORT_ASC);
        $pageSize = min($this->getPageSize($request, self::PAGE_SIZE), self::MAX_PAGE_SIZE);

        $collection = $repository->collection(
            $search,
            $sort,
            $sortDir,
            $pageSize,
            $this->getPageOffset($this->getPage($request), $pageSize)
        );

        return $this->response(
            [
                '@context' => 'http://www.w3.org/ns/hydra/context.jsonld',
                '@id' => $this->router->generate('tle_collection', [], UrlGeneratorInterface::ABSOLUTE_URL),
                '@type' => 'Collection',
                'totalItems' => $collection->getTotal(),
                'member' => $collection->getCollection(),
                'parameters' => [
                    self::SEARCH_PARAM => $search ?? '*',
                    self::SORT_PARAM => $sort,
                    self::SORT_DIR_PARAM => $sortDir,
                    self::PAGE_PARAM => $this->getPage($request),
                    self::PAGE_SIZE_PARAM => $pageSize,
                ],
                'view' => $this->getPagination($request, $collection->getTotal(), $pageSize),
            ]
        );
    }
}
