<?php

namespace App\Controller;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\ViewModel\Filter;
use App\ViewModel\SortDirectionEnum;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route("/api/tle")]
final class TleController extends AbstractApiController
{
    protected const MAX_PAGE_SIZE = 100;

    protected const PAGE_SIZE = 20;

    public const FILTER_ECCENTRICITY = 'eccentricity';
    public const FILTER_INCLINATION = 'inclination';

    public const PARAM_EXTRA = 'extra';

    protected const COLLECTION_FILTERS = [
        self::FILTER_ECCENTRICITY => Filter::FILTER_TYPE_FLOAT,
        self::FILTER_INCLINATION => Filter::FILTER_TYPE_FLOAT,
    ];

    public function __construct(protected TleRepository $repository)
    {
    }

    #[Route("/{id}", name: "tle_record", requirements: ["id" => "\d+"])]
    public function record(
        int $id,
        NormalizerInterface $normalizer,
        Request $request,
    ): Response {
        $this->assertParamIsBoolean($request, self::PARAM_EXTRA);

        $extra = (bool)$request->get(self::PARAM_EXTRA, false);

        /** @var Tle $tle */
        $tle = $this->repository->findOneBy(['id' => $id]);

        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $id));
        }

        $data = [
            '@context' => self::HYDRA_CONTEXT,
        ];

        return $this->response(
            array_merge($data, $normalizer->normalize($tle, null, [self::PARAM_EXTRA => $extra])),
        );
    }

    #[Route("/", name: "tle_collection")]
    public function collection(
        Request $request,
        NormalizerInterface $normalizer
    ): Response {
        $this
            ->assertParamIsInteger($request, self::PAGE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_PARAM, 0)
            ->assertParamIsInteger($request, self::PAGE_SIZE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_SIZE_PARAM, 0)
            ->assertParamIsLessThan($request, self::PAGE_SIZE_PARAM, self::MAX_PAGE_SIZE)
            ->assertParamInEnum($request, self::SORT_DIR_PARAM, SortDirectionEnum::toArray())
            ->assertParamInEnum($request, self::SORT_PARAM, TleCollectionSortableFieldsEnum::toArray())
            ->assertParamIsBoolean($request, self::PARAM_EXTRA);

        $extra = (bool)$request->get(self::PARAM_EXTRA, false);

        /** @var Filter[] $filters */
        $filters = $this->assertFilter($request, self::COLLECTION_FILTERS);

        $search = $request->get(self::SEARCH_PARAM);
        $sort = $request->get(self::SORT_PARAM, TleCollectionSortableFieldsEnum::POPULARITY);
        $sortDir = $request->get(self::SORT_DIR_PARAM, SortDirectionEnum::DESCENDING);
        $pageSize = (int)min($request->get(self::PAGE_SIZE_PARAM, self::PAGE_SIZE), self::MAX_PAGE_SIZE);

        $collection = $this->repository->collection(
            $search,
            $sort,
            $sortDir,
            $pageSize,
            $this->getPageOffset($this->getPage($request), $pageSize),
            $filters,
        );

        $parameters = [
            self::SEARCH_PARAM => $search ?? '*',
            self::SORT_PARAM => $sort,
            self::SORT_DIR_PARAM => $sortDir,
            self::PAGE_PARAM => $this->getPage($request),
            self::PAGE_SIZE_PARAM => $pageSize,
        ];

        foreach ($filters as $filter) {
            $parameters[\sprintf('%s[%s]', $filter->filter, $filter->operator)] = $filter->value;
        }

        $response = [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $this->router->generate('tle_collection', [], UrlGeneratorInterface::ABSOLUTE_URL),
            '@type' => 'Collection',
            'totalItems' => $collection->getTotal(),
            'member' => $collection->getCollection(),
            'parameters' => $parameters,
            'view' => $this->getPagination($request, $collection->getTotal(), $pageSize),
        ];

        return $this->response(
            $normalizer->normalize($response, null, [self::PARAM_EXTRA => $extra])
        );
    }

    #[Route("/popular", name: "tle_popular")]
    public function popular(
        Request $request,
        TleRepository $repository
    ): Response {
        $newerThan = new \DateTime('now');
        $newerThan->setTime(0, 0, 0);
        $newerThan->modify('-3 days');

        $limit = 10;

        $members = $repository->popular($newerThan, $limit);

        $data = [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $this->router->generate('tle_popular', [], UrlGeneratorInterface::ABSOLUTE_URL),
            '@type' => 'Collection',
            'totalItems' => \count($members),
            'member' => $members,
            'parameters' => [
                '*limit' => $limit,
                '*newerThan' => $newerThan->format(self::DATETIME_FORMAT),
            ],
        ];

        return $this->response($data);
    }
}
