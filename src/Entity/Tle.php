<?php

namespace App\Entity;

use App\Field\IdField;
use App\Field\NameField;
use App\Field\TleField;
use App\Service\DateTimeService;
use Doctrine\ORM\Mapping as ORM;

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
}
