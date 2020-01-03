<?php

namespace App\Serializer;

use App\Entity\Tle;
use App\ViewModel\Model\TleModel;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class TleModelNormalizer implements NormalizerInterface
{
    private UrlGeneratorInterface $router;

    public function __construct(UrlGeneratorInterface $router)
    {
        $this->router = $router;
    }

    /**
     * @param TleModel $model
     * @param null     $format
     * @param array    $context
     *
     * @return array|bool|float|int|string
     */
    public function normalize($entity, string $format = null, array $context = [])
    {
        $id = $this->router->generate('tle_record', ['id' => $entity->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        $model = new TleModel($entity->getLine1(), $entity->getLine2(), $entity->getName());

        return [
            '@id' => $id,
            '@type' => 'TleModel',
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
