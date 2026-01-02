<?php

namespace App\Normalizer;

use App\ViewModel\Observer;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ObserverNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Observer $object */
        return [
            '@type' => 'Observer',
            'latitude' => $object->latitude,
            'longitude' => $object->longitude,
            'altitude' => $object->altitude,
            'timezone' => $object->getTimezone(),
            'date' => $object->date->format(\DateTimeInterface::ATOM),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Observer;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [Observer::class => true];
    }
}
