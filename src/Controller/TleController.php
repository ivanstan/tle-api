<?php

namespace App\Controller;

use App\Enum\TleCollectionSortableFieldsEnum;
use App\Repository\TleRepository;
use App\Request\TleCollectionRequest;
use App\Request\TleRequest;
use App\Service\Traits\TleHttpTrait;
use App\ViewModel\Filter;
use Ivanstan\SymfonySupport\Services\QueryBuilderPaginator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route("/api/tle")]
final class TleController extends AbstractApiController
{
    use TleHttpTrait;

    protected const COLLECTION_FILTERS = [
        TleCollectionSortableFieldsEnum::ECCENTRICITY => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::INCLINATION => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::PERIOD => Filter::FILTER_TYPE_FLOAT,
        TleCollectionSortableFieldsEnum::SATELLITE_ID => Filter::FILTER_TYPE_ARRAY,
    ];

    public function __construct(protected TleRepository $repository)
    {
    }

    #[Route("/{id}", name: "tle_record", requirements: ["id" => "\d+"])]
    public function record(
        TleRequest $request,
        NormalizerInterface $normalizer,
    ): JsonResponse {
        return $this->response(
            [
                '@context' => self::HYDRA_CONTEXT,
                ...$normalizer->normalize($this->getTle($request->getId()), null, [TleRequest::EXTRA_PARAM => $request->getExtra()]),
            ]
        );
    }

    #[Route("/", name: "tle_collection")]
    public function collection(
        TleCollectionRequest $request,
        NormalizerInterface $normalizer
    ): JsonResponse {
        $satelliteIds = $request->get(TleCollectionSortableFieldsEnum::SATELLITE_ID, []);

        /** @var Filter[] $filters */
        $filters = $this->assertFilter($request, self::COLLECTION_FILTERS);

        $builder = $this->repository->collection(
            $request->getSearch(),
            $request->getSort(TleCollectionSortableFieldsEnum::POPULARITY),
            $request->getSortDirection(),
            $filters,
        );

        $pagination = new QueryBuilderPaginator($builder);
        $pagination->setFromRequest($request);

        $parameters = [
            TleCollectionRequest::$searchParam => $request->getSearch() ?? '*',
            TleCollectionRequest::$sortParam => $request->getSort(TleCollectionSortableFieldsEnum::POPULARITY),
            TleCollectionRequest::$sortDirParam => $request->getSortDirection(),
            TleCollectionRequest::$pageParam => $request->getPage(),
            TleCollectionRequest::$pageSizeParam => $request->getPageSize(),
        ];

        foreach ($filters as $filter) {
            if ($filter->filter === TleCollectionSortableFieldsEnum::SATELLITE_ID) {
                continue;
            }
            $parameters[\sprintf('%s[%s]', $filter->filter, $filter->operator)] = $filter->value;
        }

        foreach ($satelliteIds as $index => $satelliteId) {
            $name = \sprintf('%s[%d]', TleCollectionSortableFieldsEnum::SATELLITE_ID, $index);
            $parameters[$name] = $satelliteId;
        }

        $response = $normalizer->normalize($pagination, null, [TleRequest::EXTRA_PARAM => $request->getExtra()]);
        $response['parameters'] = $parameters;

        return $this->response($response);
    }
}
