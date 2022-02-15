<?php

namespace App\Controller;

use App\Repository\TleRepository;
use App\Request\FlyOverRequest;
use App\Service\FlyOverService;
use DateTimeInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

final class FlyOverController extends AbstractApiController
{
    public function __construct(
        protected TleRepository $repository,
        protected NormalizerInterface $normalizer,
        protected FlyOverService $service
    ) {
    }

    #[Route("/api/tle/{id}/flyover", name: "tle_flyover", requirements: ["id" => "\d+"])]
    public function flyover(
        FlyOverRequest $request
    ): JsonResponse {
        $observer = $request->getObserver();
        $tle = $request->getTle();

        $date = $request->getDateTime();

        $this->service
            ->setObserver($observer)
            ->setTle($tle);

        $results = $this->service->getPasses($date, $request->filterVisible());

        $parameters = [
            'latitude' => $observer->latitude,
            'longitude' => $observer->longitude,
            'only_visible' => $request->filterVisible(),
            'date' => $date->format(DateTimeInterface::ATOM),
        ];

        $url = $this->router->generate(
            'tle_flyover',
            [...$request->request->all(), 'id' => $request->getId(), ...$parameters],
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $parameters['satelliteId'] = $request->getId();

        $members = $this->normalizer->normalize($results, null, ['timezone' => $observer->getTimezone()]);

        foreach ($members as $index => &$member) {
            $item = [
                '@id' => $this->generateUrl('tle_flyover_details', [
                    'id' => $request->getId(),
                    'passId' => $index + 1,
                    'latitude' => $observer->latitude,
                    'longitude' => $observer->longitude,
                    'only_visible' => $request->filterVisible(),
                    'date' => $date->format(DateTimeInterface::ATOM),
                ], UrlGeneratorInterface::ABSOLUTE_URL),
            ];

            $member = $item + $member;
        }

        return $this->response(
            [
                '@context' => self::HYDRA_CONTEXT,
                '@id' => $url,
                '@type' => 'SatelliteFlyOverCollection',
                'observer' => $this->normalizer->normalize($observer),
                'tle' => $this->normalizer->normalize($tle),
                'member' => $members,
                'parameters' => $parameters,
            ]
        );
    }

    #[Route("/api/tle/{id}/flyover/{passId}", name: "tle_flyover_details", requirements: ["id" => "\d+", "passId" => "\d+"])]
    public function flyoverDetails(
        int $passId,
        FlyOverRequest $request,
    ): JsonResponse {
        $observer = $request->getObserver();
        $tle = $request->getTle();

        $this->service
            ->setObserver($observer)
            ->setTle($tle);

        $date = $request->getDateTime();

        $results = $this->service->getPasses($date, $request->filterVisible());

        $pass = $results[$passId-1] ?? null;

        if ($pass === null) {
            throw new NotFoundHttpException('Unable to find requested flyover details');
        }

        $url = $this->router->generate(
            'tle_flyover_details',
            [
                ...$request->request->all(),
                'id' => $request->getId(),
                'passId' => $passId,
                'latitude' => $observer->latitude,
                'longitude' => $observer->longitude,
                'only_visible' => $request->filterVisible(),
                'date' => $date->format(DateTimeInterface::ATOM),
            ],
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        return $this->response(
            [
                '@context' => self::HYDRA_CONTEXT,
                '@id' => $url,
                'observer' => $this->normalizer->normalize($observer),
                'tle' => $this->normalizer->normalize($tle),
                ...$this->normalizer->normalize($pass, null, ['timezone' => $observer->getTimezone(), 'details' => true]
                ),
            ]
        );
    }

}
