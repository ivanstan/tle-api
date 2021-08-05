<?php

namespace App\Controller;

use App\Repository\TleRepository;
use App\Service\Traits\TleHttpTrait;
use App\ViewModel\Filter;
use App\ViewModel\Model\QueryBuilderPaginator;
use App\ViewModel\SortDirectionEnum;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
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
        int $id,
        NormalizerInterface $normalizer,
        Request $request,
    ): JsonResponse {
        $this->assertParamIsBoolean($request, self::PARAM_EXTRA);

        $extra = (bool)$request->get(self::PARAM_EXTRA, false);

        $data = [
            '@context' => self::HYDRA_CONTEXT,
        ];

        return $this->response(
            array_merge($data, $normalizer->normalize($this->getTle($id), null, [self::PARAM_EXTRA => $extra])),
        );
    }

    #[Route("/", name: "tle_collection")]
    public function collection(
        Request $request,
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

        $extra = (bool)$request->get(self::PARAM_EXTRA, false);

        $satelliteIds = $request->get(TleCollectionSortableFieldsEnum::SATELLITE_ID, []);

        /** @var Filter[] $filters */
        $filters = $this->assertFilter($request, self::COLLECTION_FILTERS);

        $search = $request->get(self::SEARCH_PARAM);
        $sort = $request->get(self::SORT_PARAM, TleCollectionSortableFieldsEnum::POPULARITY);
        $sortDir = $request->get(self::SORT_DIR_PARAM, SortDirectionEnum::DESCENDING);

        $builder = $this->repository->collection(
            $search,
            $sort,
            $sortDir,
            $filters,
        );

        $pagination = new QueryBuilderPaginator($builder);
        $pagination->setPageSize($this->getPageSize($request, self::MAX_PAGE_SIZE));
        $pagination->setCurrentPage(
            $this->getPage($request)
        );

        $parameters = [
            self::SEARCH_PARAM => $search ?? '*',
            self::SORT_PARAM => $sort,
            self::SORT_DIR_PARAM => $sortDir,
            self::PAGE_PARAM => $this->getPage($request),
            self::PAGE_SIZE_PARAM => $this->getPageSize($request, self::MAX_PAGE_SIZE),
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
            $normalizer->normalize($response, null, [self::PARAM_EXTRA => $extra])
        );
    }
}
