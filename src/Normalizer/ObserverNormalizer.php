<?php

namespace App\Normalizer;

use App\ViewModel\Observer;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;

class ObserverNormalizer implements NormalizerInterface
{
    public function __construct(protected ObjectNormalizer $normalizer)
    {
    }

    /**
     * @param Observer $object
     *
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function normalize($object, string $format = null, array $context = []): array
    {
        return [
            '@type' => 'Observer',
            ...$this->normalizer->normalize($object),
        ];
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof Observer;
    }
}
