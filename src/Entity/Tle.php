<?php

namespace App\Entity;

use App\Field\IdField;
use App\Field\NameField;
use App\Field\TleField;
use App\Service\DateTimeService;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\OneToOne;

/**
 * @ORM\Entity(repositoryClass="App\Repository\TleRepository")
 * @ORM\HasLifecycleCallbacks()
 */
class Tle
{
    use IdField;
    use NameField;
    use TleField;

    /**
     * @OneToOne(targetEntity="TleInformation", mappedBy="tle")
     */
    private ?TleInformation $info = null;

    /**
     * @ORM\Column(name="updated_at", type="datetime")
     */
    private \DateTime $updatedAt;

    /**
     * @ORM\PrePersist()
     * @ORM\PreUpdate()
     */
    public function update(): void
    {
        $this->updatedAt = DateTimeService::getCurrentUTC();
    }

    public function getInfo(): ?TleInformation {
        return $this->info;
    }
}
