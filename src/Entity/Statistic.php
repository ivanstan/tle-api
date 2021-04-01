<?php

namespace App\Entity;

use App\Entity\Attributes\TleOneToOneReference;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\StatisticRepository")
 */
class Statistic
{
    use TleOneToOneReference;

    /**
     * @ORM\Column(name="hits", type="bigint")
     */
    private int $hits = 0;

    public function __construct(Tle $tle)
    {
        $this->tle = $tle;
    }

    public function getHits(): int
    {
        return $this->hits;
    }

    public function setHits(int $hits): void
    {
        $this->hits = $hits;
    }

    public function incrementHits(): void
    {
        $this->hits++;
    }
}
