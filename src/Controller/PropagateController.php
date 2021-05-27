<?php

namespace App\Controller;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\Service\Traits\TleHttpTrait;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class PropagateController extends AbstractApiController
{
    use TleHttpTrait;

    protected const DEEP_SATELLITE_PERIOD = 225; // minutes

    public function __construct(protected TleRepository $repository)
    {
    }

    #[Route("/api/tle/{id}/propagate", name: "tle_propagate", requirements: ["id" => "\d+"])]
    public function propagate(
        int $id,
        Request $request,
        NormalizerInterface $normalizer
    ): JsonResponse {
        /** @var Tle $tle */
        $tle = $this->repository->findOneBy(['id' => $id]);
        if ($tle === null) {
            throw new NotFoundHttpException(\sprintf('Unable to find record with id %s', $id));
        }

        $tleModel = new TleModel($tle->getLine1(), $tle->getLine2(), $tle->getName());
        $sat = new \Predict_Sat(new \Predict_TLE($tle->getName(), $tle->getLine1(), $tle->getLine2()));

        $date = $request->get('date', (new \DateTime('now', new \DateTimeZone('UTC')))->format(self::DATETIME_FORMAT));
        $datetime = \DateTime::createFromFormat(\DateTimeInterface::ATOM, str_replace(' ', '+', $date));

        $dateTimeUTC = clone $datetime;
        $dateTimeUTC->setTimezone(new \DateTimeZone('UTC'));
        $epoch = \DateTime::createFromFormat(\DateTimeInterface::ATOM, $tleModel->getDate());

        $deltaT = ($datetime->getTimestamp() - $epoch->getTimestamp()) / 60; // minutes

        $propagator = new \Predict_SGPSDP();
        if (($tleModel->period() / 60) > self::DEEP_SATELLITE_PERIOD) {
            $propagator->SDP4($sat, $deltaT);
            $algorithm = 'SDP4';
        } else {
            $propagator->SGP4($sat, $deltaT);
            $algorithm = 'SGP4';
        }

        $daynum = \Predict_Time::unix2daynum($datetime->getTimestamp());

        \Predict_Math::Convert_Sat_State($sat->pos, $sat->vel);

        $sat_geodetic = new \Predict_Geodetic();
        \Predict_SGPObs::Calculate_LatLonAlt($daynum, $sat->pos, $sat_geodetic);

        $sat_geodetic->lat = rad2deg($sat_geodetic->lat);
        $sat_geodetic->lon = rad2deg($sat_geodetic->lon);

        $parameters = [
            'date' => $datetime->format(self::DATETIME_FORMAT),
        ];

        $url = $this->router->generate(
            'tle_propagate',
            array_merge($request->request->all(), $parameters, ['id' => $id]),
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        $parameters['satelliteId'] = $id;

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
