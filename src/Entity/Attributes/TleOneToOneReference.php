<?php

namespace App\Entity\Attributes;

use App\Entity\Tle;
use Doctrine\ORM\Mapping as ORM;

trait TleOneToOneReference
{
    #[ORM\Id]
    #[ORM\OneToOne(targetEntity: Tle::class)]
    #[ORM\JoinColumn(name: 'tle_id', referencedColumnName: 'id', nullable: false)]
    protected Tle $tle;

    public function getTle(): Tle
    {
        return $this->tle;
    }

    public function setTle(Tle $tle): void
    {
        $this->tle = $tle;
    }
}
