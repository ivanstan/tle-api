<?php

namespace App\Serializer;

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
     * @param string|null $format
     * @param array $context
     *
     * @return array
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function normalize($object, string $format = null, array $context = []): array
    {
        return array_merge(
            [
                '@type' => 'Observer',
            ],
            $this->normalizer->normalize($object)
        );
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof Observer;
    }
}
