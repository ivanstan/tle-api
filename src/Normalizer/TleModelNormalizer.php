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
     */
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
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
                'geostationaryOrbit' => $object->getInfo()->geostationaryOrbit,
                'geosynchronousOrbit' => $object->getInfo()->geosynchronousOrbit,
                'circularOrbit' => $object->getInfo()->circularOrbit,
                'ellipticalOrbit' => $object->getInfo()->ellipticalOrbit,
                'lowEarthOrbit' => $object->getInfo()->lowEarthOrbit,
                'mediumEarthOrbit' => $object->getInfo()->mediumEarthOrbit,
                'highEarthOrbit' => $object->getInfo()->highEarthOrbit,
                'polarOrbit' => $object->getInfo()->polarOrbit,
                'sunSynchronousOrbit' => $object->getInfo()->sunSynchronousOrbit,
                'molniyaOrbit' => $object->getInfo()->molniyaOrbit,
                'tundraOrbit' => $object->getInfo()->tundraOrbit,
                'criticalInclinationOrbit' => $object->getInfo()->criticalInclinationOrbit,
                'posigradeOrbit' => $object->getInfo()->posigradeOrbit,
                'retrogradeOrbit' => $object->getInfo()->retrogradeOrbit,
                'decayingOrbit' => $object->getInfo()->decayingOrbit,
                'lowDrag' => $object->getInfo()->lowDrag,
            ];
            
            $normalized['classification'] = [
                'classifiedSatellite' => $object->getInfo()->classifiedSatellite,
                'unclassifiedSatellite' => $object->getInfo()->unclassifiedSatellite,
                'recentTle' => $object->getInfo()->recentTle,
            ];
        }

        return $normalized;
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Tle;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [Tle::class => true];
    }
}
