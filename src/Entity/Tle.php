<?php

namespace App\Entity;

use App\Field\IdField;
use App\Field\TleField;
use App\Repository\TleRepository;
use App\Service\DateTimeService;
use Doctrine\ORM\Mapping as ORM;
use Ivanstan\SymfonySupport\Field\NameField;

#[ORM\Entity(repositoryClass: TleRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Tle
{
    use IdField;
    use NameField;
    use TleField;

    #[ORM\OneToOne(mappedBy: 'tle', targetEntity: TleInformation::class)]
    private ?TleInformation $info = null;

    #[ORM\Column(name: 'updated_at', type: 'datetime')]
    private \DateTime $updatedAt;

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function update(): void
    {
        $this->updatedAt = DateTimeService::getCurrentUTC();
    }

    public function getInfo(): ?TleInformation
    {
        return $this->info;
    }
}
