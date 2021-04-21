<?php

namespace App\Controller;

use App\Entity\Tle;
use App\Repository\TleRepository;
use App\Service\Traits\TleHttpTrait;
use App\ViewModel\Observer;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
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

    #[Route("/api/tle/{id}/pass", name: "tle_pass", requirements: ["id" => "\d+"])]
    public function pass(
        int $id,
        Request $request,
        NormalizerInterface $normalizer
    ): JsonResponse {
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

        $tle = $this->getTle($id);

        $tle = new \Predict_TLE($tle->getName(), $tle->getLine1(), $tle->getLine2());
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

        return $this->response($data);
    }

    #[Route("/api/tle/{id}/vector", name: "tle_propagate", requirements: ["id" => "\d+"])]
    public function vector(
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
            '@type' => 'SatelliteStateVector',
            'propagator' => $algorithm,
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
            'geodetic' => [
                'latitude' => $sat_geodetic->lat,
                'longitude' => $sat_geodetic->lon,
                'altitude' => $sat_geodetic->alt,
            ],
            'parameters' => $parameters,
        ];

        return $this->response($data);
    }
}
