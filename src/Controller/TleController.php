<?php

namespace App\Controller;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\ViewModel\SortDirectionEnum;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route("/api/tle")]
class TleController extends AbstractApiController
{
    protected const MAX_PAGE_SIZE = 100;

    protected const PAGE_SIZE = 20;

    #[Route("/{id}", name: "tle_record", requirements: ["id" => "\d+"])]
    public function record(int $id, TleRepository $repository): Response
    {
        /** @var Tle $tle */
        $tle = $repository->findOneBy(['id' => $id]);

        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $id));
        }

        return $this->response($tle);
    }

    #[Route("/", name: "tle_collection")]
    public function collection(Request $request, TleRepository $repository): Response
    {
        $this
            ->assertParamIsInteger($request, self::PAGE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_PARAM, 0)
            ->assertParamIsInteger($request, self::PAGE_SIZE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_SIZE_PARAM, 0)
            ->assertParamIsLessThan($request, self::PAGE_SIZE_PARAM, self::MAX_PAGE_SIZE)
            ->assertParamInEnum($request, self::SORT_DIR_PARAM, SortDirectionEnum::toArray())
            ->assertParamInEnum($request, self::SORT_PARAM, TleCollectionSortableFieldsEnum::toArray());

        $search = $request->get(self::SEARCH_PARAM);
        $sort = $request->get(self::SORT_PARAM, TleCollectionSortableFieldsEnum::POPULARITY);
        $sortDir = $request->get(self::SORT_DIR_PARAM, SortDirectionEnum::DESCENDING);
        $pageSize = (int)min($request->get(self::PAGE_SIZE_PARAM, self::PAGE_SIZE), self::MAX_PAGE_SIZE);

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
