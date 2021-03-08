<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\StatisticRepository")
 */
class Statistic
{
    /**
     * @ORM\Id
     * @ORM\OneToOne(targetEntity="Tle")
     * @ORM\JoinColumn(name="tle_id", referencedColumnName="id", nullable=false)
     */
    private Tle $tle;

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

    public function getTle(): Tle
    {
        return $this->tle;
    }
}
