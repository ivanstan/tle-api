<?php

namespace App\Controller;

use App\Enum\PropagatorAlgorithm;
use App\Repository\TleRepository;
use App\Request\PropagateRequest;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

final class PropagateController extends AbstractApiController
{
    protected const DEEP_SATELLITE_PERIOD = 225; // minutes

    protected \Predict_SGPSDP $propagator;

    public function __construct(protected TleRepository $repository)
    {
        $this->propagator = new \Predict_SGPSDP();
    }

    #[Route('/api/tle/{id}/propagate', name: 'tle_propagate', requirements: ['id' => "\d+"])]
    public function propagate(
        PropagateRequest $request,
        NormalizerInterface $normalizer
    ): JsonResponse {
        $tle = $request->getTle();

        $tleModel = new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName());
        $sat = new \Predict_Sat(new \Predict_TLE($tle->getName(), $tle->getLine1(), $tle->getLine2()));

        $datetime = $request->getDateTime();
        $deltaT = ($datetime->getTimestamp() - $tleModel->epochDateTime()->getTimestamp()) / 60; // minutes

        $algorithm = ($tleModel->period() / 60) > self::DEEP_SATELLITE_PERIOD ? PropagatorAlgorithm::SDP4 : PropagatorAlgorithm::SGP4;

        $this->propagator->$algorithm($sat, $deltaT);

        \Predict_Math::Convert_Sat_State($sat->pos, $sat->vel);

        $sat_geodetic = new \Predict_Geodetic();
        \Predict_SGPObs::Calculate_LatLonAlt(\Predict_Time::unix2daynum($datetime->getTimestamp()), $sat->pos, $sat_geodetic);

        $sat_geodetic->lat = rad2deg($sat_geodetic->lat);
        $sat_geodetic->lon = rad2deg($sat_geodetic->lon);

        $parameters = [
            'date' => $datetime->format(\DateTimeInterface::ATOM),
        ];

        $url = $this->router->generate(
            'tle_propagate',
            array_merge($request->request->all(), $parameters, ['id' => $request->getId()]),
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $parameters['satelliteId'] = $request->getId();

        $data = [
            '@context' => self::HYDRA_CONTEXT,
            '@id' => $url,
            '@type' => 'SatellitePropagationResult',
            'tle' => $tle,
            'algorithm' => $algorithm,
            'vector' => [
                'reference_frame' => 'ECI',
                'position' => [
                    'x' => $sat->pos->x,
                    'y' => $sat->pos->y,
                    'z' => $sat->pos->z,
                    'r' => $sat->pos->w,
                    'unit' => 'km',
                ],
                'velocity' => [
                    'x' => $sat->vel->x,
                    'y' => $sat->vel->y,
                    'z' => $sat->vel->z,
                    'r' => $sat->vel->w,
                    'unit' => 'km/s',
                ],
            ],
            'geodetic' => [
                'latitude' => $sat_geodetic->lat,
                'longitude' => $sat_geodetic->lon,
                'altitude' => $sat_geodetic->alt,
            ],
            'parameters' => $parameters,
        ];

        return $this->response(
            $normalizer->normalize($data)
        );
    }
}
