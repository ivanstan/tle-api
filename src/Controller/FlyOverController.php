<?php

namespace App\Controller;

use App\Repository\TleRepository;
use App\Service\FlyOverService;
use App\Service\Traits\TleHttpTrait;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

final class FlyOverController extends AbstractApiController
{
    use TleHttpTrait;

    public function __construct(
        protected TleRepository $repository,
        protected NormalizerInterface $normalizer,
        protected FlyOverService $service
    ) {
    }

    #[Route("/api/tle/{id}/flyover", name: "tle_flyover", requirements: ["id" => "\d+"])]
    public function flyover(
        int $id,
        Request $request
    ): JsonResponse {
        $observer = $this->getObserver($request);
        $onlyVisible = $request->get('only_visible', true);

        $this->service
            ->setObserver($observer)
            ->setTle($this->getTle($id));

        if ($onlyVisible) {
            $results = $this->service->getVisiblePasses(\Predict_Time::get_current_daynum());
        } else {
            $results = $this->service->getPasses(\Predict_Time::get_current_daynum());
        }

        $parameters = [
            'latitude' => $observer->latitude,
            'longitude' => $observer->longitude,
            'only_visible' => $onlyVisible,
        ];

        $url = $this->router->generate(
            'tle_flyover',
            array_merge($request->request->all(), $parameters, ['id' => $id]),
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $parameters['satelliteId'] = $id;

        $members = $this->normalizer->normalize($results, null, ['timezone' => $observer->getTimezone()]);

        foreach ($members as $index => &$member) {
            $item = [
                '@id' => $this->generateUrl('tle_flyover_details', ['id' => $id, 'passId' => $index], UrlGeneratorInterface::ABSOLUTE_URL),
            ];

            $member = $item + $member;
        }

        return $this->response(
            [
                '@context' => self::HYDRA_CONTEXT,
                '@id' => $url,
                '@type' => 'SatelliteFlyOverCollection',
                'observer' => $this->normalizer->normalize($observer),
                'member' => $members,
                'parameters' => $parameters,
            ]
        );
    }

    #[Route("/api/tle/{id}/flyover/{passId}", name: "tle_flyover_details", requirements: ["id" => "\d+", "passId" => "\d+"])]
    public function flyoverDetails(
        int $id,
        int $passId,
        Request $request,
    ): JsonResponse {
        $observer = $this->getObserver($request);
        $onlyVisible = $request->get('only_visible', true);

        $this->service
            ->setObserver($observer)
            ->setTle($this->getTle($id));

        if ($onlyVisible) {
            $results = $this->service->getVisiblePasses(\Predict_Time::get_current_daynum());
        } else {
            $results = $this->service->getPasses(\Predict_Time::get_current_daynum());
        }

        $pass = $results[$passId] ?? null;

        if ($pass === null) {
            throw new NotFoundHttpException('Unable to find requested flyover details');
        }

        $url = $this->router->generate(
            'tle_flyover_details',
            array_merge($request->request->all(), ['id' => $id, 'passId' => $passId]),
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $data = [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $url,
            'observer' => $this->normalizer->normalize($observer),
        ];

        return $this->response(
            array_merge(
                $data,
                $this->normalizer->normalize($pass, null, ['timezone' => $observer->getTimezone(), 'details' => true])
            )
        );
    }

}
