<?php

namespace App\Normalizer;

use App\Entity\Tle;
use App\Enum\TleCollectionSortableFieldsEnum;
use App\Request\TleRequest;
use Ivanstan\Tle\Model\Tle as TleModel;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class TleModelNormalizer implements NormalizerInterface
{
    public function __construct(private UrlGeneratorInterface $router)
    {
    }

    /**
     * @param Tle $object
     * @param string|null $format
     * @param array $context
     *
     * @return array
     */
    public function normalize($object, ?string $format = null, array $context = []): array
    {
        $id = $this->router->generate('tle_record', ['id' => $object->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        $model = new TleModel($object->getLine1(), $object->getLine2(), $object->getName());

        $isExtra = ($context[TleRequest::EXTRA_PARAM] ?? null) === true;

        $normalized = [
            '@id' => $id,
            '@type' => 'Tle',
            'satelliteId' => $model->getId(),
            'name' => $model->getName(),
            'date' => $model->epochDateTime()->format(\DateTimeInterface::ATOM),
            'line1' => $model->getLine1(),
            'line2' => $model->getLine2(),
        ];

        if ($isExtra && $object->getInfo()) {
            $normalized['extra'] = [
                TleCollectionSortableFieldsEnum::ECCENTRICITY => $object->getInfo()->eccentricity,
                TleCollectionSortableFieldsEnum::INCLINATION => $object->getInfo()->inclination,
                TleCollectionSortableFieldsEnum::PERIOD => $object->getInfo()->period,
                TleCollectionSortableFieldsEnum::RAAN => $object->getInfo()->raan,
                TleCollectionSortableFieldsEnum::SEMI_MAJOR_AXIS => $object->getInfo()->semiMajorAxis,
            ];

            $normalized['orbit'] = [
                'geostationary' => $object->getInfo()->geostationary,
            ];
        }

        return $normalized;
    }

    public function supportsNormalization($data, string $format = null): bool
    {
        return $data instanceof Tle;
    }
}
