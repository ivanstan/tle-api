<?php

namespace App\Serializer;

use App\Controller\TleController;
use App\Entity\Tle;
use App\ViewModel\TleCollectionSortableFieldsEnum;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class TleModelNormalizer implements NormalizerInterface
{
    public function __construct(private UrlGeneratorInterface $router)
    {
    }

    /**
     * @param Tle $entity
     * @param string|null $format
     * @param array $context
     *
     * @return array
     */
    public function normalize($entity, ?string $format = null, array $context = []): array
    {
        $id = $this->router->generate('tle_record', ['id' => $entity->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        $model = new TleModel($entity->getLine1(), $entity->getLine2(), $entity->getName());

        $isExtra = ($context[TleController::PARAM_EXTRA] ?? null) === true;

        $normalized = [
            '@id' => $id,
            '@type' => 'TleModel',
            'satelliteId' => $model->getId(),
            'name' => $model->getName(),
            'date' => $model->getDate(),
            'line1' => $model->getLine1(),
            'line2' => $model->getLine2(),
        ];

        if ($isExtra) {
            $extra = [
                'extra' => [
                    TleCollectionSortableFieldsEnum::ECCENTRICITY => $entity->getInfo()->eccentricity,
                    TleCollectionSortableFieldsEnum::INCLINATION => $entity->getInfo()->inclination,
                    TleCollectionSortableFieldsEnum::PERIOD => $entity->getInfo()->period,
                ],
            ];

            $normalized = array_merge($normalized, $extra);
        }

        return $normalized;
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof Tle;
    }
}
