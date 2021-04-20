<?php

namespace App\Serializer;

use App\Controller\AbstractApiController;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class SatellitePassNormalizer implements NormalizerInterface
{
    /**
     * @param \Predict_Pass $object
     * @param string|null $format
     * @param array $context
     *
     * @return array
     */
    public function normalize($object, string $format = null, array $context = []): array
    {
        return [
            '@type' => 'VisibleSatellitePass',
            'aos' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_aos, $context['timezone'])->format(
                    AbstractApiController::DATETIME_FORMAT
                ),
                'azimuth' => round($object->visible_aos_az, 2),
                'elevation' => round($object->visible_aos_el, 2),
            ],
            'max' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_tca, $context['timezone'])->format(
                    AbstractApiController::DATETIME_FORMAT
                ),
                'azimuth' => round($object->visible_max_el_az, 2),
                'elevation' => round($object->visible_max_el, 2),
            ],
            'los' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_los, $context['timezone'])->format(
                    AbstractApiController::DATETIME_FORMAT
                ),
                'azimuth' => round($object->visible_los_az, 2),
                'elevation' => round($object->visible_los_el, 2),
            ],
        ];
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof \Predict_Pass;
    }
}
