<?php

namespace App\Entity;

use App\Entity\Attributes\TleOneToOneReference;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\TleInformationRepository")
 */
class TleInformation
{
    use TleOneToOneReference;

    /**
     * @ORM\Column(type="float", precision=14, scale=12, nullable=true)
     */
    public float $eccentricity;

    /**
     * @ORM\Column(type="float", precision=16, scale=10, nullable=true)
     */
    public float $inclination;

    public function __construct(Tle $tle)
    {
        $this->tle = $tle;
    }
}
