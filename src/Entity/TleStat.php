<?php

namespace App\Entity;

use App\Entity\Attributes\TleOneToOneReference;
use App\Repository\TleStatRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(TleStatRepository::class)]
#[ORM\Table(name: 'tle_stats')]
class TleStat
{
    public const MAX_I = 'max_i';
    public const MAX_E = 'max_e';
    public const MAX_P = 'max_p';
    public const MIN_P = 'min_p';

    #[ORM\Id]
    #[ORM\Column(name: 'name', type: 'string')]
    private string $name;

    use TleOneToOneReference;

    public function __construct(string $name)
    {
        $this->setName($name);
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }
}
