<?php

namespace App\Field;

use Doctrine\ORM\Mapping as ORM;

trait TleField
{
    #[ORM\Column(name: 'line1', type: 'string')]
    private string $line1;

    #[ORM\Column(name: 'line2', type: 'string')]
    private string $line2;

    public function getLine1(): string
    {
        return $this->line1;
    }

    public function setLine1(string $line1): void
    {
        $this->line1 = $line1;
    }

    public function getLine2(): string
    {
        return $this->line2;
    }

    public function setLine2(string $line2): void
    {
        $this->line2 = $line2;
    }
}
