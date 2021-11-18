<?php

namespace App\Normalizer;

use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;

class SatellitePassNormalizer implements NormalizerInterface
{
    public function __construct(protected ObjectNormalizer $normalizer)
    {
    }

    /**
     * @param \Predict_Pass $object
     * @param string|null $format
     * @param array $context
     *
     * @return array
     */
    public function normalize($object, string $format = null, array $context = []): array
    {
        $timezone = $context['timezone'] ?? 'UTC';
        $details = $context['details'] ?? false;

        $result = [
            '@type' => $details ? 'SatelliteFlyOverDetails' : 'SatelliteFlyOver',
            'aos' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_aos ?? $object->aos, $timezone)->format(
                    \DateTimeInterface::ATOM
                ),
                'azimuth' => round($object->visible_aos_az ?? null, 2),
                'elevation' => round($object->visible_aos_el ?? null, 2),
            ],
            'max' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_tca ?? $object->tca, $timezone)->format(
                    \DateTimeInterface::ATOM
                ),
                'azimuth' => round($object->visible_max_el_az ?? null, 2),
                'elevation' => round($object->visible_max_el ?? null, 2),
            ],
            'los' => [
                'date' => \Predict_Time::daynum2datetime($object->visible_los ?? $object->los, $timezone)->format(
                    \DateTimeInterface::ATOM
                ),
                'azimuth' => round($object->visible_los_az ?? $object->los_az, 2),
                'elevation' => round($object->visible_los_el ?? null, 2),
            ],
        ];

        if ($details) {
            foreach ($object->details as $item) {
                $result['details'][] = [
                    'azimuth' => $item->az,
                    'elevation' => $item->el
                ];
            }
        }

        return $result;
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof \Predict_Pass;
    }
}
