<?php

namespace App\Controller;

use App\Enum\TleCollectionSortableFieldsEnum;
use App\Repository\TleRepository;
use App\Request\TleCollectionRequest;
use App\Request\TleRequest;
use App\Service\Traits\TleHttpTrait;
use App\ViewModel\Filter;
use App\ViewModel\Model\QueryBuilderPaginator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route("/api/tle")]
final class TleController extends AbstractApiController
{
    use TleHttpTrait;

    public const PARAM_EXTRA = 'extra';

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
        $data = [
            '@context' => self::HYDRA_CONTEXT,
        ];

        return $this->response(
            array_merge($data, $normalizer->normalize($this->getTle($request->getId()), null, [self::PARAM_EXTRA => $request->getExtra()])),
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
        $pagination
            ->setPageSize($request->getPageSize())
            ->setCurrentPage($request->getPage());

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

        $response = $pagination->getCollection($request, $this->router);
        $response['parameters'] = $parameters;

        return $this->response(
            $normalizer->normalize($response, null, [self::PARAM_EXTRA => $request->getExtra()])
        );
    }
}
