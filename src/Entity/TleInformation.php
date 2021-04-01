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
     * @ORM\Column(type="float", precision=10, nullable=true)
     */
    public int $eccentricity;

    /**
     * @ORM\Column(type="float", precision=10, nullable=true)
     */
    public int $inclination;

    public function __construct(Tle $tle)
    {
        $this->tle = $tle;
    }
}
