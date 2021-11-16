<?php

namespace App\Controller;

use App\Service\DateTimeService;
use App\ViewModel\Filter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Contracts\Service\Attribute\Required;

abstract class AbstractApiController extends AbstractController
{
    protected const HYDRA_CONTEXT = 'https://www.w3.org/ns/hydra/context.jsonld';

    protected RouterInterface $router;

    #[Required]
    public function setRouter(RouterInterface $router): void
    {
        $this->router = $router;
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

    protected function assertFilter(Request $request, array $filters): array
    {
        $result = [];

        foreach ($filters as $filter => $type) {
            $values = $request->get($filter, []);

            if ($type === Filter::FILTER_TYPE_ARRAY && !empty($values)) {
                $result[] = new Filter($filter, $type, Filter::OPERATOR_EQUAL, $values);

                continue;
            }

            foreach ($values as $operator => $value) {
                $result[] = new Filter($filter, $type, $operator, $value);
            }
        }

        return $result;
    }
}
