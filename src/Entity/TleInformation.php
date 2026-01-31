<?php

namespace App\Entity;

use App\Entity\Attributes\TleOneToOneReference;
use App\Repository\TleInformationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TleInformationRepository::class)]
class TleInformation
{
    use TleOneToOneReference;

    #[ORM\Column(type: 'float', precision: 14, scale: 12, nullable: true)]
    public ?float $eccentricity;

    #[ORM\Column(type: 'float', precision: 16, scale: 10, nullable: true)]
    public ?float $inclination;

    #[ORM\Column(type: 'float', precision: 16, scale: 10, nullable: true)]
    public ?float $raan;

    #[ORM\Column(type: 'float', precision: 16, scale: 10, nullable: true)]
    public ?float $semiMajorAxis;

    /**
     * Period for complete orbit in seconds.
     */
    #[ORM\Column(name: '`period`', type: 'float', precision: 24, scale: 10, nullable: true)]
    public ?float $period;

    // Orbit type specifications
    #[ORM\Column(name: 'geo_stationary_orbit', type: 'boolean', options: ['default' => 0])]
    public bool $geostationaryOrbit = false;

    #[ORM\Column(name: 'geo_synchronous_orbit', type: 'boolean', options: ['default' => 0])]
    public bool $geosynchronousOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $circularOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $ellipticalOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $lowEarthOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $mediumEarthOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $highEarthOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $polarOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $sunSynchronousOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $molniyaOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $tundraOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $criticalInclinationOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $posigradeOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $retrogradeOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $decayingOrbit = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $lowDrag = false;

    // Satellite classification
    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $classifiedSatellite = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $unclassifiedSatellite = false;

    #[ORM\Column(type: 'boolean', options: ['default' => 0])]
    public bool $recentTle = false;

    public function __construct(Tle $tle)
    {
        $this->tle = $tle;
    }
}
