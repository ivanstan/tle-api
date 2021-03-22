<?php

namespace App\Serializer;

use App\Entity\Tle;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class TleModelNormalizer implements NormalizerInterface
{
    public function __construct(private UrlGeneratorInterface $router)
    {
    }

    /**
     * @param $entity
     * @param string|null $format
     * @param array $context
     *
     * @return array
     */
    public function normalize($entity, string $format = null, array $context = [])
    {
        $id = $this->router->generate('tle_record', ['id' => $entity->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        $model = new TleModel($entity->getLine1(), $entity->getLine2(), $entity->getName());

        return [
            '@id' => $id,
            '@type' => 'TleModel',
            'satelliteId' => $model->getId(),
            'name' => $model->getName(),
            'date' => $model->getDate(),
            'line1' => $model->getLine1(),
            'line2' => $model->getLine2(),
        ];
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof Tle;
    }
}
