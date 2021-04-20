<?php

namespace App\Controller;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\ViewModel\Observer;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class PropagateController extends AbstractApiController
{
    public function __construct(protected TleRepository $repository)
    {
    }

    #[Route("/api/tle/{id}/next-pass", name: "tle_pass", requirements: ["id" => "\d+"])]
    public function nextPass(int $id, Request $request, NormalizerInterface $normalizer): JsonResponse {

        try {
            $observer = new Observer((float)$request->get('latitude', 0), (float)$request->get('longitude', 0));
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage());
        }

        $predict = new \Predict();
        $qth = new \Predict_QTH();

        $qth->lat = $observer->latitude;
        $qth->lon = $observer->longitude;
        $qth->alt = $observer->altitude;

        /** @var Tle $tle */
        $tle = $this->repository->findOneBy(['id' => $id]);

        $tle = new \Predict_TLE($tle->getName(), $tle->getLine1(), $tle->getLine2()); // Instantiate it
        $sat = new \Predict_Sat($tle); // Load up the satellite data
        $now = \Predict_Time::get_current_daynum(); // get the current time as Julian Date (daynum)

        $predict->minEle = 10; // Minimum elevation for a pass
        $predict->timeRes = 10; // Pass details: time resolution in seconds
        $predict->numEntries = 20; // Pass details: number of entries per pass
        $predict->threshold = -6; // Twilight threshold (sun must be at this lat or lower)

        // Get the passes and filter visible only, takes about 4 seconds for 10 days
        $results = $predict->get_passes($sat, $qth, $now, 10);
        $results = $predict->filterVisiblePasses($results);

        $parameters = [
            'latitude' => $observer->latitude,
            'longitude' => $observer->longitude,
        ];

        $url = $this->router->generate(
            'tle_pass',
            array_merge($request->request->all(), $parameters, ['id' => $id]),
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $parameters['satelliteId'] = $id;

        $data = [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $url,
            '@type' => 'VisibleSatellitePassCollection',
            'observer' => $normalizer->normalize($observer),
            'member' => $normalizer->normalize($results, null, ['timezone' => $observer->getTimeZone()]),
            'parameters' => $parameters,
        ];

        return new JsonResponse($data);
    }
}
