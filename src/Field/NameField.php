<?php

namespace App\Field;

use Doctrine\ORM\Mapping as ORM;

trait NameField
{
    #[ORM\Column(name: 'name', type: 'string')]
    private string $name;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }
}
