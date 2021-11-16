<?php

namespace App\Controller;

use App\Enum\SortDirectionEnum;
use App\Enum\TleCollectionSortableFieldsEnum;
use App\Repository\TleRepository;
use App\Request\CollectionRequest;
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

    protected const MAX_PAGE_SIZE = 100;

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
        NormalizerInterface $normalizer,
        TleRequest $request,
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
        $this
            ->assertParamIsInteger($request, self::PAGE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_PARAM, 0)
            ->assertParamIsInteger($request, self::PAGE_SIZE_PARAM)
            ->assertParamIsGreaterThan($request, self::PAGE_SIZE_PARAM, 0)
            ->assertParamIsLessThan($request, self::PAGE_SIZE_PARAM, self::MAX_PAGE_SIZE)
            ->assertParamInEnum($request, self::SORT_DIR_PARAM, SortDirectionEnum::toArray())
            ->assertParamInEnum($request, self::SORT_PARAM, TleCollectionSortableFieldsEnum::toArray())
            ->assertParamIsBoolean($request, self::PARAM_EXTRA);

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
        $pagination->setPageSize($request->getPageSize());
        $pagination->setCurrentPage($request->getPage());

        $parameters = [
            CollectionRequest::SEARCH_PARAM => $request->getSearch() ?? '*',
            CollectionRequest::SORT_PARAM => $request->getSort(TleCollectionSortableFieldsEnum::POPULARITY),
            CollectionRequest::SORT_DIR_PARAM => $request->getSortDirection(),
            CollectionRequest::PAGE_PARAM => $request->getPage(),
            CollectionRequest::PAGE_SIZE_PARAM => $request->getPageSize(),
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
