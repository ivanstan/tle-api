<?php

namespace App\Controller;

use App\Enum\TleCollectionSortableFieldsEnum;
use App\Repository\TleRepository;
use App\Request\TleCollectionRequest;
use App\Request\TleRequest;
use Ivanstan\SymfonySupport\Services\QueryBuilderPaginator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route('/api/tle')]
final class TleController extends AbstractApiController
{
    public function __construct(protected TleRepository $repository)
    {
    }

    #[Route('/{id}', name: 'tle_record', requirements: ['id' => "\d+"])]
    public function record(
        TleRequest $request,
        NormalizerInterface $normalizer,
    ): JsonResponse {
        return $this->response(
            [
                '@context' => self::HYDRA_CONTEXT,
                ...$normalizer->normalize($request->getTle(), null, [TleRequest::EXTRA_PARAM => $request->getExtra()]),
            ]
        );
    }

    #[Route('/', name: 'tle_collection')]
    public function collection(
        TleCollectionRequest $request,
        NormalizerInterface $normalizer
    ): JsonResponse {
        $builder = $this->repository->collection(
            $request->getSearch(),
            $request->getSort(TleCollectionSortableFieldsEnum::POPULARITY),
            $request->getSortDirection(),
            $request->getFilters(),
        );

        $pagination = new QueryBuilderPaginator($builder);
        $pagination->setFromRequest($request);

        $response = $normalizer->normalize($pagination, null, [TleRequest::EXTRA_PARAM => $request->getExtra()]);
        $response['parameters'] = $request->getParameters();

        return $this->response($response);
    }
}
